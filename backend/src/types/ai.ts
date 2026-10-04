/**
 * Shared contract for the Tin Pata AI API.
 *
 * The web client mirrors these types in `tin-pata-web/types/ai.ts`. The two files are
 * kept in sync by hand — the Next.js project cannot import from the backend build.
 * Change both together.
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

/** Optional, non-sensitive context. Never required, never persisted with the passage. */
export interface ExplainTextContext {
  bookId?: string;
  bookTitle?: string;
  pageNumber?: number;
}

export interface ExplainTextRequest {
  action: 'explain_text';
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
  | 'server_misconfigured'
  | 'unknown';

export interface AIErrorBody {
  error: {
    code: AIErrorCode;
    message: string;
  };
}

/** HTTP status for each error code. Single source of truth for the API surface. */
export const STATUS_BY_CODE: Record<AIErrorCode, number> = {
  unauthorized: 401,
  invalid_request: 400,
  text_too_short: 400,
  text_too_long: 413,
  unsupported_action: 400,
  unsupported_mode: 400,
  rate_limited: 429,
  provider_unavailable: 503,
  invalid_model_response: 502,
  server_misconfigured: 503,
  unknown: 500,
};

/** Token counts returned by OpenAI. Never includes passage or response text. */
export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}
