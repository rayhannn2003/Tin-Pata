import { config } from '../config/env';
import {
  MAX_OUTPUT_TOKENS,
  OPENAI_REQUEST_TIMEOUT_MS,
  OPENAI_RESPONSES_URL,
  getExplainModel,
  getReasoningEffort,
  type ReasoningEffort,
} from '../config/openai';
import { buildInstructions, buildUserInput } from '../prompts/explain-text.prompt';
import {
  EXPLAIN_SCHEMA_NAME,
  EXPLAIN_TEXT_JSON_SCHEMA,
  parseExplanation,
} from '../schemas/explain-response.schema';
import type {
  AIErrorCode,
  AIUsage,
  ExplainTextRequest,
  ExplainTextResponse,
} from '../types/ai';

/**
 * The single place in Tin Pata that holds the OpenAI key and speaks the OpenAI wire
 * protocol. Future actions (summarize_notes, session_recap, RAG retrieval) should
 * reuse this module rather than call OpenAI directly.
 */

interface ResponsesApiPayload {
  status?: string;
  incomplete_details?: { reason?: string };
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string; refusal?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; code?: string; type?: string };
}

export type ExplainResult =
  | { ok: true; response: ExplainTextResponse; usage: AIUsage; model: string }
  | { ok: false; code: AIErrorCode; message: string; debug: string };

function readUsage(payload: ResponsesApiPayload): AIUsage {
  const input = Number(payload.usage?.input_tokens ?? 0);
  const output = Number(payload.usage?.output_tokens ?? 0);
  const total = Number(payload.usage?.total_tokens ?? input + output);
  return {
    inputTokens: Number.isFinite(input) ? input : 0,
    outputTokens: Number.isFinite(output) ? output : 0,
    totalTokens: Number.isFinite(total) ? total : 0,
  };
}

/** Pull the JSON payload out of the Responses API output array. */
function readOutputText(payload: ResponsesApiPayload): {
  text: string;
  refused: boolean;
} {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return { text: payload.output_text, refused: false };
  }

  const chunks: string[] = [];
  let refused = false;
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'refusal' || typeof part.refusal === 'string') {
        refused = true;
        continue;
      }
      if (typeof part.text === 'string') {
        chunks.push(part.text);
      }
    }
  }
  return { text: chunks.join('').trim(), refused };
}

function buildBody(
  request: ExplainTextRequest,
  model: string,
  reasoning: ReasoningEffort | null,
): Record<string, unknown> {
  return {
    model,
    instructions: buildInstructions(request.mode),
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: buildUserInput(request) }],
      },
    ],
    // No tools in v2.2A: no web search, no file search, no code interpreter.
    tools: [],
    text: {
      format: {
        type: 'json_schema',
        name: EXPLAIN_SCHEMA_NAME,
        strict: true,
        schema: EXPLAIN_TEXT_JSON_SCHEMA,
      },
    },
    max_output_tokens: MAX_OUTPUT_TOKENS[request.mode],
    // Passages are user book content: never retained by the provider for training.
    store: false,
    ...(reasoning ? { reasoning: { effort: reasoning } } : {}),
  };
}

/**
 * Calls the OpenAI Responses API and returns a validated, schema-shaped explanation.
 *
 * `debug` is for the server log only. It never contains the passage, the prompt, or
 * the model's answer, and it is never returned to a client.
 */
export async function explainText(request: ExplainTextRequest): Promise<ExplainResult> {
  const apiKey = config.openaiApiKey;
  if (!apiKey) {
    return {
      ok: false,
      code: 'server_misconfigured',
      message: 'AI explanation is temporarily unavailable.',
      debug: 'OPENAI_API_KEY is not set',
    };
  }

  const model = getExplainModel();
  let reasoning: ReasoningEffort | null = getReasoningEffort();
  let payload: ResponsesApiPayload | null = null;
  let httpStatus = 0;

  // One retry without `reasoning`, for models that reject the parameter.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(buildBody(request, model, reasoning)),
        signal: AbortSignal.timeout(OPENAI_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      return {
        ok: false,
        code: 'provider_unavailable',
        message: 'AI explanation is temporarily unavailable.',
        debug: timedOut ? 'openai request timed out' : 'openai request failed',
      };
    }

    httpStatus = response.status;
    payload = (await response.json().catch(() => null)) as ResponsesApiPayload | null;

    if (response.ok) {
      break;
    }

    const providerMessage = payload?.error?.message ?? '';
    const rejectsReasoning =
      response.status === 400 && reasoning !== null && /reasoning/i.test(providerMessage);

    if (rejectsReasoning && attempt === 0) {
      reasoning = null;
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        code: 'server_misconfigured',
        message: 'AI explanation is temporarily unavailable.',
        debug: `openai rejected credentials (${response.status})`,
      };
    }
    if (response.status === 429) {
      return {
        ok: false,
        code: 'rate_limited',
        message: 'Too many requests. Try again shortly.',
        debug: 'openai rate limit',
      };
    }
    return {
      ok: false,
      code: 'provider_unavailable',
      message: 'AI explanation is temporarily unavailable.',
      debug: `openai error (${response.status}) ${payload?.error?.code ?? ''}`.trim(),
    };
  }

  if (!payload) {
    return {
      ok: false,
      code: 'provider_unavailable',
      message: 'AI explanation is temporarily unavailable.',
      debug: `openai returned an unreadable body (${httpStatus})`,
    };
  }

  const usage = readUsage(payload);

  if (payload.status === 'incomplete') {
    return {
      ok: false,
      code: 'invalid_model_response',
      message: 'The explanation could not be generated correctly. Please try again.',
      debug: `openai incomplete: ${payload.incomplete_details?.reason ?? 'unknown'}`,
    };
  }

  const { text, refused } = readOutputText(payload);
  if (refused || !text) {
    return {
      ok: false,
      code: 'invalid_model_response',
      message: 'The explanation could not be generated correctly. Please try again.',
      debug: refused ? 'openai refused the passage' : 'openai returned no output text',
    };
  }

  const parsed = parseExplanation(text, request.mode);
  if (!parsed) {
    return {
      ok: false,
      code: 'invalid_model_response',
      message: 'The explanation could not be generated correctly. Please try again.',
      debug: 'model output did not match the explanation schema',
    };
  }

  return { ok: true, response: parsed, usage, model };
}
