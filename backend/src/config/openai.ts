import { config } from './env';
import type { ExplanationMode } from '../types/ai';

/** OpenAI wiring in one place: endpoint, model choice, budgets. */

export const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

/**
 * Fallback when OPENAI_EXPLAIN_MODEL is unset. Carried over from the Edge Function.
 * Prefer setting the model in the server `.env` — switching models needs no code change.
 */
export const DEFAULT_EXPLAIN_MODEL = 'gpt-5.6-luna';

export const OPENAI_REQUEST_TIMEOUT_MS = 60_000;

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

const REASONING_EFFORTS: readonly ReasoningEffort[] = [
  'minimal',
  'low',
  'medium',
  'high',
];

/**
 * Ceilings, not targets — the prompt asks for a concise answer and this stops a
 * runaway one. Reasoning tokens are billed against the same budget, so these sit
 * well above the prose length we actually want.
 */
export const MAX_OUTPUT_TOKENS: Record<ExplanationMode, number> = {
  simple_english: 2000,
  very_simple_english: 2000,
  bangla: 2400,
  english_bangla: 2800,
  vocabulary: 2000,
  sentence_by_sentence: 3200,
};

export function getExplainModel(): string {
  return config.openaiExplainModel || DEFAULT_EXPLAIN_MODEL;
}

export function getReasoningEffort(): ReasoningEffort {
  const configured = config.openaiReasoningEffort as ReasoningEffort;
  return REASONING_EFFORTS.includes(configured) ? configured : 'low';
}
