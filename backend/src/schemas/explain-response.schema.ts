import type {
  ExplainTextResponse,
  ExplanationMode,
  SentenceExplanation,
  VocabularyItem,
} from '../types/ai';

export const EXPLAIN_SCHEMA_NAME = 'tin_pata_explanation';

/**
 * JSON Schema for OpenAI Structured Outputs (`strict: true`).
 *
 * Strict mode requires every property to be listed in `required` and forbids
 * `additionalProperties`, so "optional" fields are modelled as nullable and the
 * nulls are stripped in `parseExplanation` before the response reaches the client.
 */
export const EXPLAIN_TEXT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mainIdea',
    'explanation',
    'simpleEnglish',
    'banglaExplanation',
    'vocabulary',
    'sentenceBreakdown',
  ],
  properties: {
    mainIdea: {
      type: 'string',
      description: 'The gist of the passage in 1-2 sentences.',
    },
    explanation: {
      type: 'string',
      description: 'The main explanation body, in the language required by the mode.',
    },
    simpleEnglish: {
      type: ['string', 'null'],
      description:
        'Plain-English rewrite of the passage. Null unless the mode asks for it.',
    },
    banglaExplanation: {
      type: ['string', 'null'],
      description: 'Bangla explanation. Null unless the mode asks for it.',
    },
    vocabulary: {
      type: 'array',
      description:
        'Difficult terms only. Empty when the passage has none worth explaining.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'simpleMeaning', 'banglaMeaning', 'contextualMeaning'],
        properties: {
          term: { type: 'string' },
          simpleMeaning: { type: 'string' },
          banglaMeaning: { type: ['string', 'null'] },
          contextualMeaning: {
            type: ['string', 'null'],
            description: 'What the term means in this specific sentence.',
          },
        },
      },
    },
    sentenceBreakdown: {
      type: 'array',
      description:
        'One item per sentence, in order. Empty outside sentence-by-sentence mode.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'simpleExplanation', 'banglaExplanation'],
        properties: {
          original: { type: 'string' },
          simpleExplanation: { type: 'string' },
          banglaExplanation: { type: ['string', 'null'] },
        },
      },
    },
  },
} as const;

function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function vocabulary(value: unknown): VocabularyItem[] {
  if (!Array.isArray(value)) return [];
  const items: VocabularyItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as Record<string, unknown>;
    const term = text(raw.term);
    const simpleMeaning = text(raw.simpleMeaning);
    if (!term || !simpleMeaning) continue;
    const banglaMeaning = text(raw.banglaMeaning);
    const contextualMeaning = text(raw.contextualMeaning);
    items.push({
      term,
      simpleMeaning,
      ...(banglaMeaning ? { banglaMeaning } : {}),
      ...(contextualMeaning ? { contextualMeaning } : {}),
    });
  }
  return items;
}

function sentences(value: unknown): SentenceExplanation[] {
  if (!Array.isArray(value)) return [];
  const items: SentenceExplanation[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const raw = entry as Record<string, unknown>;
    const original = text(raw.original);
    const simpleExplanation = text(raw.simpleExplanation);
    if (!original || !simpleExplanation) continue;
    const banglaExplanation = text(raw.banglaExplanation);
    items.push({
      original,
      simpleExplanation,
      ...(banglaExplanation ? { banglaExplanation } : {}),
    });
  }
  return items;
}

/**
 * Validates the model's JSON and drops the schema's null placeholders so the client
 * can render deterministically from presence alone. Returns null when the payload is
 * unusable — the caller maps that to `invalid_model_response`.
 */
export function parseExplanation(
  raw: string,
  mode: ExplanationMode,
): ExplainTextResponse | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }

  const value = parsed as Record<string, unknown>;
  const mainIdea = text(value.mainIdea);
  const explanation = text(value.explanation);
  if (!mainIdea || !explanation) {
    return null;
  }

  const simpleEnglish = text(value.simpleEnglish);
  const banglaExplanation = text(value.banglaExplanation);
  const sentenceBreakdown = sentences(value.sentenceBreakdown);

  return {
    action: 'explain_text',
    mode,
    mainIdea,
    explanation,
    ...(simpleEnglish ? { simpleEnglish } : {}),
    ...(banglaExplanation ? { banglaExplanation } : {}),
    vocabulary: vocabulary(value.vocabulary),
    ...(sentenceBreakdown.length > 0 ? { sentenceBreakdown } : {}),
  };
}
