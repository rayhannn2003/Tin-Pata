import { config } from '../config/env';
import { insertAsUser } from '../config/supabase';
import type { AIAction, AIUsage } from '../types/ai';

/**
 * Cost and operational telemetry — not content surveillance.
 *
 * Records who called, which action, which model, how many tokens, how long it took,
 * and whether it succeeded. It deliberately does NOT record the selected passage, the
 * prompt, the model's answer, or any book content. If that ever needs to change it is
 * a product decision with a privacy note, not a logging tweak.
 */

const USAGE_TABLE = 'ai_usage_events';

export interface UsageEvent {
  userId: string;
  action: AIAction;
  model: string;
  usage: AIUsage | null;
  status: string;
  latencyMs: number;
}

/**
 * Best-effort insert, written as the calling user so RLS still applies.
 * A missing table or a failed insert must never fail the user's request.
 */
export async function logUsageEvent(
  accessToken: string,
  event: UsageEvent,
): Promise<void> {
  if (!config.usageLoggingEnabled) {
    return;
  }

  await insertAsUser(USAGE_TABLE, accessToken, {
    user_id: event.userId,
    action: event.action,
    model: event.model,
    input_tokens: event.usage?.inputTokens ?? 0,
    output_tokens: event.usage?.outputTokens ?? 0,
    total_tokens: event.usage?.totalTokens ?? 0,
    status: event.status,
    latency_ms: event.latencyMs,
  });
}
