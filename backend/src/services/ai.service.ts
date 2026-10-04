import { logger } from '../utils/logger';
import { getExplainModel } from '../config/openai';
import { explainText as callOpenAI } from './openai.service';
import { logUsageEvent } from './ai-usage.service';
import type { AIErrorCode, ExplainTextRequest, ExplainTextResponse } from '../types/ai';

/**
 * Application logic for the AI feature: run the model call, record usage, log the
 * outcome. Sits between the controller (HTTP concerns) and openai.service (provider
 * concerns) so neither has to know about the other.
 */

export interface ExplainCommand {
  request: ExplainTextRequest;
  userId: string;
  accessToken: string;
  requestId: string;
}

export type ExplainOutcome =
  | { ok: true; response: ExplainTextResponse }
  | { ok: false; code: AIErrorCode; message: string };

export async function explain(command: ExplainCommand): Promise<ExplainOutcome> {
  const { request, userId, accessToken, requestId } = command;

  const startedAt = Date.now();
  const result = await callOpenAI(request);
  const latencyMs = Date.now() - startedAt;

  // Telemetry is best-effort and must never fail or delay the user's answer path
  // beyond its own short timeout.
  await logUsageEvent(accessToken, {
    userId,
    action: 'explain_text',
    model: result.ok ? result.model : getExplainModel(),
    usage: result.ok ? result.usage : null,
    status: result.ok ? 'ok' : result.code,
    latencyMs,
  });

  if (!result.ok) {
    logger.warn('ai.explain failed', {
      requestId,
      status: result.code,
      mode: request.mode,
      latencyMs,
      detail: result.debug,
    });
    return { ok: false, code: result.code, message: result.message };
  }

  logger.info('ai.explain ok', {
    requestId,
    mode: request.mode,
    latencyMs,
    model: result.model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  });

  return { ok: true, response: result.response };
}
