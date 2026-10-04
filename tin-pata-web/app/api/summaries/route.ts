import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';

import { GEMINI_MODEL, summarizeWithGemini } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import type {
  SummaryLanguage,
  SummaryLength,
  SummaryQuota,
  SummaryRequest,
  SummaryResult,
} from '@/types/summary';

export const runtime = 'nodejs';

const MAX_PAGES = 30;
const MAX_TEXT_CHARS = 180_000;
const MIN_TEXT_CHARS = 40;
const PROMPT_VERSION = 'v1';

function json(body: SummaryResult, status: number) {
  return NextResponse.json(body, { status });
}

function validLanguage(value: unknown): value is SummaryLanguage {
  return value === 'en' || value === 'bn';
}

function validLength(value: unknown): value is SummaryLength {
  return value === 'short' || value === 'detailed';
}

function normalizeText(text: string) {
  return text.replace(/\u0000/g, '').replace(/[ \t]{2,}/g, ' ').trim();
}

function sourceHash(request: SummaryRequest, text: string) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        text,
        pageStart: request.pageStart,
        pageEnd: request.pageEnd,
        language: request.language,
        length: request.length,
        promptVersion: PROMPT_VERSION,
        model: GEMINI_MODEL,
      }),
    )
    .digest('hex');
}

function parseQuota(row: unknown): SummaryQuota | null {
  if (!row || typeof row !== 'object') return null;
  const value = row as Record<string, unknown>;
  const used = Number(value.used);
  const limit = Number(value.daily_limit);
  const remaining = Number(value.remaining);
  if (![used, limit, remaining].every(Number.isFinite)) return null;
  return { used, limit, remaining };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return json({ ok: false, code: 'CONFIG', error: 'Supabase is not configured.' }, 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return json({ ok: false, code: 'AUTH', error: 'Sign in to generate summaries.' }, 401);
  }

  let body: Partial<SummaryRequest>;
  try {
    body = (await request.json()) as Partial<SummaryRequest>;
  } catch {
    return json({ ok: false, code: 'INPUT', error: 'Invalid request body.' }, 400);
  }

  const bookId = typeof body.bookId === 'string' ? body.bookId : '';
  const pageStart = Number(body.pageStart);
  const pageEnd = Number(body.pageEnd);
  if (
    !bookId ||
    !Number.isInteger(pageStart) ||
    !Number.isInteger(pageEnd) ||
    pageStart < 1 ||
    pageEnd < pageStart ||
    pageEnd - pageStart + 1 > MAX_PAGES ||
    !validLanguage(body.language) ||
    !validLength(body.length) ||
    typeof body.text !== 'string'
  ) {
    return json(
      {
        ok: false,
        code: 'INPUT',
        error: `Choose a valid range of no more than ${MAX_PAGES} pages.`,
      },
      400,
    );
  }

  const text = normalizeText(body.text);
  if (text.length < MIN_TEXT_CHARS) {
    return json(
      {
        ok: false,
        code: 'NO_TEXT',
        error: 'No selectable text was found. Scanned PDFs need OCR before summarization.',
      },
      400,
    );
  }
  if (text.length > MAX_TEXT_CHARS) {
    return json(
      {
        ok: false,
        code: 'INPUT',
        error: 'The selected text is too large. Choose a smaller page range.',
      },
      413,
    );
  }

  const { data: book } = await supabase
    .from('books')
    .select('id, title, total_pages')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!book || pageEnd > Math.max(1, book.total_pages || pageEnd)) {
    return json({ ok: false, code: 'BOOK', error: 'Book or page range not found.' }, 404);
  }

  const completeRequest: SummaryRequest = {
    bookId,
    pageStart,
    pageEnd,
    language: body.language,
    length: body.length,
    text,
  };
  const hash = sourceHash(completeRequest, text);

  const { data: cached, error: cacheReadError } = await supabase
    .from('ai_summary_cache')
    .select('summary_text, model')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .eq('source_hash', hash)
    .eq('prompt_version', PROMPT_VERSION)
    .maybeSingle();

  if (cacheReadError) {
    return json(
      {
        ok: false,
        code: 'DATABASE',
        error: 'AI summary database is not configured. Run the AI summaries SQL migration.',
      },
      503,
    );
  }
  if (cached) {
    return json(
      {
        ok: true,
        summary: cached.summary_text,
        cached: true,
        model: cached.model,
        quota: null,
      },
      200,
    );
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return json(
      {
        ok: false,
        code: 'CONFIG',
        error: 'Gemini is not configured on the server.',
      },
      503,
    );
  }

  const { data: quotaRows, error: quotaError } = await supabase.rpc(
    'consume_ai_summary_quota',
  );
  if (quotaError) {
    return json(
      {
        ok: false,
        code: 'DATABASE',
        error: 'AI quota is not configured. Run the AI summaries SQL migration.',
      },
      503,
    );
  }
  const quota = parseQuota(Array.isArray(quotaRows) ? quotaRows[0] : quotaRows);
  const allowed =
    Array.isArray(quotaRows) && quotaRows[0] && typeof quotaRows[0] === 'object'
      ? Boolean((quotaRows[0] as Record<string, unknown>).allowed)
      : false;
  if (!allowed) {
    return json(
      {
        ok: false,
        code: 'QUOTA',
        error: 'Daily free AI summary limit reached. It resets at 00:00 UTC.',
        ...(quota ? { quota } : {}),
      },
      429,
    );
  }

  try {
    const summary = await summarizeWithGemini({
      text,
      language: body.language,
      length: body.length,
      pageStart,
      pageEnd,
      bookTitle: book.title,
    });

    await supabase.from('ai_summary_cache').insert({
      user_id: user.id,
      book_id: bookId,
      page_start: pageStart,
      page_end: pageEnd,
      language: body.language,
      summary_length: body.length,
      source_hash: hash,
      prompt_version: PROMPT_VERSION,
      model: GEMINI_MODEL,
      summary_text: summary,
    });

    return json(
      {
        ok: true,
        summary,
        cached: false,
        model: GEMINI_MODEL,
        quota,
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return json(
      {
        ok: false,
        code: 'PROVIDER',
        error:
          message === 'GEMINI_RATE_LIMIT'
            ? 'Gemini free-tier rate limit reached. Wait briefly and retry.'
            : 'Gemini could not generate this summary. Try again.',
        ...(quota ? { quota } : {}),
      },
      message === 'GEMINI_RATE_LIMIT' ? 429 : 502,
    );
  }
}
