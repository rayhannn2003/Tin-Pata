/**
 * Tin Pata AI contract (web).
 *
 * Mirrors `backend/src/types/ai.ts`. The backend is built and deployed separately and
 * cannot be imported from this project, so the two files are kept in sync by hand —
 * change both together.
 */

/** Actions the API accepts. v2.2A ships `explain_text` only. */
export const AI_ACTIONS = ['explain_text'] as const;
export type AIAction = (typeof AI_ACTIONS)[number];

export const EXPLANATION_MODES = [
  'simple_english',
  'very_simple_english',
  'bangla',
  'english_bangla',
  'vocabulary',
  'sentence_by_sentence',
] as const;
export type ExplanationMode = (typeof EXPLANATION_MODES)[number];

export interface ExplainTextContext {
  bookId?: string;
  bookTitle?: string;
  pageNumber?: number;
}

export interface ExplainTextRequest {
  /**
   * Optional: `POST /api/ai/explain` already names the operation. Kept in the type so
   * the contract stays self-describing and an older client that still sends it works.
   */
  action?: 'explain_text';
  text: string;
  mode: ExplanationMode;
  context?: ExplainTextContext;
}

export interface VocabularyItem {
  term: string;
  simpleMeaning: string;
  banglaMeaning?: string;
  contextualMeaning?: string;
}

export interface SentenceExplanation {
  original: string;
  simpleExplanation: string;
  banglaExplanation?: string;
}

export interface ExplainTextResponse {
  action: 'explain_text';
  mode: ExplanationMode;
  mainIdea: string;
  explanation: string;
  simpleEnglish?: string;
  banglaExplanation?: string;
  vocabulary: VocabularyItem[];
  sentenceBreakdown?: SentenceExplanation[];
}

export type AIErrorCode =
  | 'unauthorized'
  | 'invalid_request'
  | 'text_too_short'
  | 'text_too_long'
  | 'unsupported_action'
  | 'unsupported_mode'
  | 'rate_limited'
  | 'provider_unavailable'
  | 'invalid_model_response'
  | 'network_error'
  | 'server_misconfigured'
  | 'unknown';

export type AIExplainResult =
  | { ok: true; response: ExplainTextResponse }
  | { ok: false; code: AIErrorCode; message: string };

/** Panel-level request lifecycle. */
export type AIRequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; response: ExplainTextResponse }
  | { status: 'error'; code: AIErrorCode; message: string };

/** Must match MAX_EXPLAIN_TEXT_CHARS in the backend (`backend/src/schemas/ai.schema.ts`). */
export const MAX_EXPLAIN_TEXT_CHARS = 12_000;

/** Below this a selection is a word, not a passage — the dictionary handles those. */
export const MIN_EXPLAIN_TEXT_CHARS = 12;

export interface ExplanationModeOption {
  value: ExplanationMode;
  label: string;
  hint: string;
}

export const EXPLANATION_MODE_OPTIONS: readonly ExplanationModeOption[] = [
  {
    value: 'simple_english',
    label: 'Simple English',
    hint: 'Easier English, with the meaning explained.',
  },
  {
    value: 'very_simple_english',
    label: 'Very Simple',
    hint: 'Short sentences and common words for hard passages.',
  },
  {
    value: 'bangla',
    label: 'বাংলা',
    hint: 'Explained in Bangla — not a literal translation.',
  },
  {
    value: 'english_bangla',
    label: 'English + বাংলা',
    hint: 'Both explanations, plus key vocabulary.',
  },
  {
    value: 'vocabulary',
    label: 'Vocabulary',
    hint: 'Difficult words and what they mean here.',
  },
  {
    value: 'sentence_by_sentence',
    label: 'Sentence by sentence',
    hint: 'Each sentence explained in order.',
  },
] as const;

export function explanationModeLabel(mode: ExplanationMode): string {
  return EXPLANATION_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

export function isExplanationMode(value: unknown): value is ExplanationMode {
  return (
    typeof value === 'string' && (EXPLANATION_MODES as readonly string[]).includes(value)
  );
}

export interface AIPreferences {
  /** Explanation language/style preference. Deliberately independent of the UI language. */
  defaultExplanationMode: ExplanationMode;
}

export const DEFAULT_AI_PREFERENCES: AIPreferences = {
  defaultExplanationMode: 'simple_english',
};

export const AI_SETTING_KEYS = {
  defaultExplanationMode: 'ai_default_explanation_mode',
} as const;
