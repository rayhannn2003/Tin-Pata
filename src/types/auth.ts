import type { Session, User } from '@supabase/supabase-js';

export type AuthUser = {
  id: string;
  email: string | null;
  created_at: string;
};

export interface AuthSessionState {
  session: Session | null;
  user: AuthUser | null;
}

export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuthMode = 'local' | 'signed_in';

export type AuthErrorCode =
  | 'not_configured'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'network_error'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
  }
}

export function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
  };
}