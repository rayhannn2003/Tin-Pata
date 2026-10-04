import { createClient } from '@/lib/supabase/client';
import { apiUrl } from '@/lib/api/config';
import type {
  AIErrorCode,
  AIExplainResult,
  ExplainTextRequest,
  ExplainTextResponse,
  ExplanationMode,
} from '@/types/ai';
import { MAX_EXPLAIN_TEXT_CHARS, MIN_EXPLAIN_TEXT_CHARS } from '@/types/ai';

const EXPLAIN_PATH = '/api/ai/explain';
const REQUEST_TIMEOUT_MS = 70_000;

export interface ExplainTextOptions {
  text: string;
  mode: ExplanationMode;
  bookId?: string;
  bookTitle?: string;
  pageNumber?: number;
  signal?: AbortSignal;
}

const MESSAGE_BY_CODE: Record<AIErrorCode, string> = {
  unauthorized: 'Sign in to use Tin Pata AI.',
  invalid_request: 'That selection could not be explained.',
  text_too_short: 'Select a longer passage to explain.',
  text_too_long: 'This selection is too large. Select a smaller passage.',
  unsupported_action: 'That AI action is not available yet.',
  unsupported_mode: 'That explanation mode is not available.',
  rate_limited: 'Too many requests. Try again shortly.',
  provider_unavailable: 'AI explanation is temporarily unavailable.',
  invalid_model_response:
    'The explanation could not be generated correctly. Please try again.',
  network_error: 'Could not reach Tin Pata AI. Check your connection and try again.',
  server_misconfigured: 'AI explanation is temporarily unavailable.',
  unknown: 'AI explanation is temporarily unavailable.',
};

function fail(code: AIErrorCode, message?: string): AIExplainResult {
  return { ok: false, code, message: message ?? MESSAGE_BY_CODE[code] };
}

function isErrorCode(value: unknown): value is AIErrorCode {
  return typeof value === 'string' && value in MESSAGE_BY_CODE;
}

/** Collapses PDF text-layer artefacts. The backend normalizes again server-side. */
export function normalizeSelectedText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/­/g, '')
    .replace(/([A-Za-z])-\n(?=[a-z])/g, '$1')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function codeFromStatus(status: number): AIErrorCode {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 413) return 'text_too_long';
  if (status === 429) return 'rate_limited';
  if (status === 400) return 'invalid_request';
  if (status === 502) return 'invalid_model_response';
  if (status >= 500) return 'provider_unavailable';
  return 'unknown';
}

async function readError(response: Response): Promise<AIExplainResult> {
  const body = (await response.json().catch(() => null)) as {
    error?: { code?: unknown; message?: unknown };
  } | null;

  const code = isErrorCode(body?.error?.code)
    ? body.error.code
    : codeFromStatus(response.status);
  const message =
    typeof body?.error?.message === 'string' && body.error.message.trim()
      ? body.error.message
      : MESSAGE_BY_CODE[code];

  return { ok: false, code, message };
}

/**
 * Client for the Tin Pata AI API.
 *
 * OpenAI is never called from the browser: this posts a structured intent to the
 * Tin Pata backend, which holds the API key, owns the prompt, and rate-limits per
 * user. Only the selected passage and the chosen mode are sent.
 *
 * The caller's Supabase access token is forwarded as a bearer token; the backend
 * verifies it against Supabase Auth and derives the user id from it. Identity is
 * never sent in the body.
 */
export const AIService = {
  /** Local guard so an obviously invalid selection never costs a round trip. */
  canExplain(text: string): boolean {
    const normalized = normalizeSelectedText(text);
    return (
      normalized.length >= MIN_EXPLAIN_TEXT_CHARS &&
      normalized.length <= MAX_EXPLAIN_TEXT_CHARS
    );
  },

  async explainText(options: ExplainTextOptions): Promise<AIExplainResult> {
    const text = normalizeSelectedText(options.text);
    if (text.length < MIN_EXPLAIN_TEXT_CHARS) {
      return fail('text_too_short');
    }
    if (text.length > MAX_EXPLAIN_TEXT_CHARS) {
      return fail('text_too_long');
    }

    const url = apiUrl(EXPLAIN_PATH);
    const client = createClient();
    if (!url || !client) {
      return fail('server_misconfigured');
    }

    const {
      data: { session },
    } = await client.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      return fail('unauthorized');
    }

    // No `action` field: the route names the operation, and the backend refuses
    // anything that is not a supported mode.
    const request: ExplainTextRequest = {
      text,
      mode: options.mode,
      context: {
        ...(options.bookId ? { bookId: options.bookId } : {}),
        ...(options.bookTitle ? { bookTitle: options.bookTitle } : {}),
        ...(options.pageNumber ? { pageNumber: options.pageNumber } : {}),
      },
    };

    // Own controller rather than AbortSignal.any(), which is too new to rely on.
    const controller = new AbortController();
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    const onCallerAbort = () => controller.abort();
    options.signal?.addEventListener('abort', onCallerAbort, { once: true });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } catch {
      if (options.signal?.aborted) {
        return fail('unknown', 'Request cancelled.');
      }
      return timedOut ? fail('provider_unavailable') : fail('network_error');
    } finally {
      window.clearTimeout(timer);
      options.signal?.removeEventListener('abort', onCallerAbort);
    }

    if (!response.ok) {
      return readError(response);
    }

    const data = (await response.json().catch(() => null)) as ExplainTextResponse | null;
    if (
      !data ||
      data.action !== 'explain_text' ||
      typeof data.mainIdea !== 'string' ||
      typeof data.explanation !== 'string' ||
      !Array.isArray(data.vocabulary)
    ) {
      return fail('invalid_model_response');
    }

    return { ok: true, response: data };
  },

  /** Plain-text rendering used by the panel's Copy action. */
  formatAsPlainText(
    response: ExplainTextResponse,
    context?: { bookTitle?: string; pageNumber?: number },
  ): string {
    const lines: string[] = ['Tin Pata AI'];

    const where = [
      context?.bookTitle,
      context?.pageNumber ? `Page ${context.pageNumber}` : undefined,
    ]
      .filter(Boolean)
      .join(' — ');
    if (where) {
      lines.push(where);
    }

    lines.push('', `Main idea: ${response.mainIdea}`, '', response.explanation);

    if (response.simpleEnglish) {
      lines.push('', 'Simple English', response.simpleEnglish);
    }
    if (response.banglaExplanation) {
      lines.push('', 'বাংলা', response.banglaExplanation);
    }
    if (response.vocabulary.length > 0) {
      lines.push('', 'Vocabulary');
      for (const item of response.vocabulary) {
        const meanings = [item.simpleMeaning, item.banglaMeaning]
          .filter(Boolean)
          .join(' · ');
        lines.push(`- ${item.term}: ${meanings}`);
        if (item.contextualMeaning) {
          lines.push(`  Here: ${item.contextualMeaning}`);
        }
      }
    }
    if (response.sentenceBreakdown?.length) {
      lines.push('', 'Sentence by sentence');
      for (const item of response.sentenceBreakdown) {
        lines.push(`- "${item.original}"`, `  ${item.simpleExplanation}`);
        if (item.banglaExplanation) {
          lines.push(`  ${item.banglaExplanation}`);
        }
      }
    }

    return lines.join('\n');
  },
};
