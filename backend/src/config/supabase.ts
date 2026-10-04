import { config, isSupabaseConfigured } from './env';

/**
 * Supabase REST access, over plain `fetch`.
 *
 * Deliberately no `@supabase/supabase-js`: the backend only needs two calls
 * (verify a token, insert a usage row), and keeping the dependency out means one
 * less package to audit on a server that holds the OpenAI key.
 *
 * The service-role key is never used here — the backend acts as the calling user,
 * so Supabase RLS still applies to everything it writes.
 */

const AUTH_TIMEOUT_MS = 10_000;

export interface SupabaseUser {
  id: string;
  email?: string;
}

export type VerifyResult =
  | { ok: true; user: SupabaseUser }
  | { ok: false; reason: string };

/**
 * Resolves the caller's identity from their JWT against Supabase Auth.
 *
 * The user id is never taken from the request body. An anon/publishable key
 * presented as a bearer token has no `sub` claim and is rejected here.
 */
export async function verifyAccessToken(accessToken: string): Promise<VerifyResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: 'supabase env missing' };
  }

  let response: Response;
  try {
    response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, reason: 'auth lookup failed' };
  }

  if (!response.ok) {
    return { ok: false, reason: `auth rejected token (${response.status})` };
  }

  const user = (await response.json().catch(() => null)) as {
    id?: unknown;
    email?: unknown;
  } | null;

  if (!user || typeof user.id !== 'string' || !user.id) {
    return { ok: false, reason: 'auth returned no user id' };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      ...(typeof user.email === 'string' ? { email: user.email } : {}),
    },
  };
}

/** POSTs a row to a PostgREST table as the calling user. Returns false on any failure. */
export async function insertAsUser(
  table: string,
  accessToken: string,
  row: Record<string, unknown>,
  timeoutMs = 5_000,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return response.ok;
  } catch {
    return false;
  }
}
