import { NextResponse } from 'next/server';

import { performDictionaryLookup } from '@/lib/dictionary/lookup';
import { checkRateLimit } from '@/lib/dictionary/rateLimit';
import type { DictionaryMode } from '@/types/dictionary';

export const runtime = 'nodejs';

function resolveMode(value: string | null): DictionaryMode {
  if (value === 'en' || value === 'bn-en' || value === 'en-bn') {
    return value;
  }
  return 'en-bn';
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function GET(request: Request) {
  const rate = checkRateLimit(`dict:${clientKey(request)}`);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many dictionary lookups. Try again shortly.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSec) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word') ?? '';
  const mode = resolveMode(searchParams.get('mode'));

  const result = await performDictionaryLookup(word, mode);
  const status = result.ok ? 200 : result.notFound ? 404 : 400;
  return NextResponse.json(result, { status });
}
