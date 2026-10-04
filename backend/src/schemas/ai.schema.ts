import {
  AI_ACTIONS,
  EXPLANATION_MODES,
  type AIErrorCode,
  type ExplainTextContext,
  type ExplainTextRequest,
  type ExplanationMode,
} from '../types/ai';

/**
 * Request validation for the AI API.
 *
 * The client sends a structured intent only: a supported `mode` and a passage.
 * Free-form prompts, system instructions, model names, and user ids are never
 * accepted from the wire — the identity comes from the verified token and the
 * prompt comes from `prompts/explain-text.prompt.ts`.
 */

/** Upper bound on a single selection. Keeps one request cheap and bounded. */
export const MAX_EXPLAIN_TEXT_CHARS = 12_000;

/** Below this a selection is a word, not a passage — the dictionary handles those. */
export const MIN_EXPLAIN_TEXT_CHARS = 12;

const MAX_BOOK_TITLE_CHARS = 200;
const MAX_BOOK_ID_CHARS = 64;
const MAX_PAGE_NUMBER = 100_000;

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const SOFT_HYPHEN = /­/g;

export type ValidationResult =
  | { ok: true; request: ExplainTextRequest }
  | { ok: false; code: AIErrorCode; message: string };

/**
 * Collapse PDF text-layer artefacts into a readable passage.
 * Joins hyphenated line breaks, drops control characters, normalizes whitespace.
 */
export function normalizeSelectedText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(SOFT_HYPHEN, '')
    .replace(/([A-Za-z])-\n(?=[a-z])/g, '$1')
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function isMode(value: unknown): value is ExplanationMode {
  return (
    typeof value === 'string' && (EXPLANATION_MODES as readonly string[]).includes(value)
  );
}

function sanitizeContext(value: unknown): ExplainTextContext | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const context: ExplainTextContext = {};

  if (typeof raw.bookId === 'string' && raw.bookId.trim()) {
    context.bookId = raw.bookId.trim().slice(0, MAX_BOOK_ID_CHARS);
  }
  if (typeof raw.bookTitle === 'string' && raw.bookTitle.trim()) {
    context.bookTitle = normalizeSelectedText(raw.bookTitle).slice(
      0,
      MAX_BOOK_TITLE_CHARS,
    );
  }
  const page = Number(raw.pageNumber);
  if (Number.isInteger(page) && page >= 1 && page <= MAX_PAGE_NUMBER) {
    context.pageNumber = page;
  }

  return Object.keys(context).length > 0 ? context : undefined;
}

/**
 * Validates an untrusted request body for `POST /api/ai/explain`.
 *
 * `action` is optional on this route — the path already names the operation — but
 * when present it must be a supported action, so an older client that still sends
 * `{ action: 'explain_text' }` keeps working unchanged.
 */
export function validateExplainRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'invalid_request', message: 'Invalid request body.' };
  }

  const raw = body as Record<string, unknown>;

  if (
    raw.action !== undefined &&
    (typeof raw.action !== 'string' ||
      !(AI_ACTIONS as readonly string[]).includes(raw.action))
  ) {
    return {
      ok: false,
      code: 'unsupported_action',
      message: 'This AI action is not supported.',
    };
  }

  if (!isMode(raw.mode)) {
    return {
      ok: false,
      code: 'unsupported_mode',
      message: 'This explanation mode is not supported.',
    };
  }

  if (typeof raw.text !== 'string') {
    return { ok: false, code: 'invalid_request', message: 'No text was selected.' };
  }

  const text = normalizeSelectedText(raw.text);

  // Rejected outright, never silently truncated — a half-explained passage is worse
  // than a clear "pick a smaller selection".
  if (text.length > MAX_EXPLAIN_TEXT_CHARS) {
    return {
      ok: false,
      code: 'text_too_long',
      message: 'This selection is too large. Select a smaller passage.',
    };
  }

  if (text.length < MIN_EXPLAIN_TEXT_CHARS) {
    return {
      ok: false,
      code: 'text_too_short',
      message: 'Select a longer passage to explain.',
    };
  }

  const context = sanitizeContext(raw.context);

  return {
    ok: true,
    request: {
      action: 'explain_text',
      text,
      mode: raw.mode,
      ...(context ? { context } : {}),
    },
  };
}
