/** Friendly auth errors — never expose raw Supabase messages to the UI. */

export type AuthErrorCode =
  | 'not_configured'
  | 'invalid_credentials'
  | 'email_already_registered'
  | 'weak_password'
  | 'password_mismatch'
  | 'invalid_email'
  | 'network_error'
  | 'session_expired'
  | 'reset_link_expired'
  | 'same_password'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
  }
}

const FRIENDLY: Record<AuthErrorCode, string> = {
  not_configured: 'Cloud sign-in is not configured. Add Supabase env vars to .env.local.',
  invalid_credentials: 'Invalid email or password.',
  email_already_registered: 'This email is already registered. Try signing in instead.',
  weak_password: 'Password is too weak. Use at least 6 characters.',
  password_mismatch: 'Passwords do not match.',
  invalid_email: 'Enter a valid email address.',
  network_error: 'Could not reach the server. Check your connection and try again.',
  session_expired: 'Your session has expired. Please sign in again.',
  reset_link_expired: 'This password reset link is invalid or has expired. Request a new one.',
  same_password: 'New password must be different from your current password.',
  unknown: 'Something went wrong. Please try again.',
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    return FRIENDLY[error.code] ?? FRIENDLY.unknown;
  }
  return FRIENDLY.unknown;
}

export function mapSupabaseAuthError(error: { message?: string; status?: number }): AuthError {
  const message = error.message?.toLowerCase() ?? '';

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid email or password')
  ) {
    return new AuthError('invalid_credentials');
  }
  if (
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('user already registered')
  ) {
    return new AuthError('email_already_registered');
  }
  if (message.includes('password') && (message.includes('least') || message.includes('weak'))) {
    return new AuthError('weak_password');
  }
  if (
    message.includes('expired') ||
    message.includes('invalid token') ||
    message.includes('otp') ||
    message.includes('recovery')
  ) {
    return new AuthError('reset_link_expired');
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('failed to fetch')) {
    return new AuthError('network_error');
  }

  return new AuthError('unknown');
}
