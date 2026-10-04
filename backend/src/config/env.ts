import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Environment configuration.
 *
 * Read once at startup so a missing variable surfaces immediately rather than on the
 * first user request. Nothing here is ever sent to a client: `OPENAI_API_KEY` in
 * particular exists only in this process and in the server's `.env`.
 */

/**
 * Version reported by /health. Deploys set APP_VERSION to the git SHA, which is what
 * makes the endpoint useful for confirming *which* build is live. Falls back to the
 * package version so a bare `node dist/server.js` still reports something real.
 */
function readVersion(): string {
  const explicit = process.env.APP_VERSION?.trim();
  if (explicit) return explicit;
  try {
    // dist/config/env.js -> package.json at the release root.
    const pkgPath = join(__dirname, '..', '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function str(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

function int(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name]?.trim() ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function list(name: string): string[] {
  return str(name)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  version: string;

  supabaseUrl: string;
  supabaseAnonKey: string;

  openaiApiKey: string;
  openaiExplainModel: string;
  openaiReasoningEffort: string;

  allowedOrigins: string[];
  usageLoggingEnabled: boolean;

  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export const config: AppConfig = {
  nodeEnv: str('NODE_ENV', 'development'),
  port: int('PORT', 3016),
  // Surfaced by /health so a deploy can be identified without exposing internals.
  version: readVersion(),

  supabaseUrl: str('SUPABASE_URL').replace(/\/+$/, ''),
  supabaseAnonKey: str('SUPABASE_ANON_KEY') || str('SUPABASE_PUBLISHABLE_KEY'),

  openaiApiKey: str('OPENAI_API_KEY'),
  openaiExplainModel: str('OPENAI_EXPLAIN_MODEL'),
  openaiReasoningEffort: str('OPENAI_EXPLAIN_REASONING_EFFORT', 'low'),

  allowedOrigins: list('AI_ALLOWED_ORIGINS'),
  usageLoggingEnabled: str('AI_USAGE_LOGGING', '1') !== '0',

  rateLimitWindowMs: int('AI_RATE_LIMIT_WINDOW_MS', 5 * 60 * 1000),
  rateLimitMaxRequests: int('AI_RATE_LIMIT_MAX_REQUESTS', 20),
};

/** True when Supabase auth verification can work at all. */
export function isSupabaseConfigured(): boolean {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

/** True when the AI route can reach OpenAI. */
export function isOpenAIConfigured(): boolean {
  return Boolean(config.openaiApiKey);
}

/**
 * Names of variables that must be set for the service to be useful.
 * Logged (names only, never values) at boot so a broken deploy is obvious.
 */
export function missingRequiredEnv(): string[] {
  const missing: string[] = [];
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!config.openaiApiKey) missing.push('OPENAI_API_KEY');
  return missing;
}
