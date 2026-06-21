import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { getSupabaseClient, isSupabaseAuthReady, isSupabaseConfigured } from '@/lib/supabase';
import {
  AuthError,
  mapSupabaseUser,
  type AuthSessionState,
  type AuthUser,
} from '@/types/auth';

const MIN_PASSWORD_LENGTH = 6;

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new AuthError('not_configured', 'Supabase is not configured.');
  }
  return client;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateCredentials(email: string, password: string): void {
  const trimmedEmail = normalizeEmail(email);
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new AuthError('invalid_credentials', 'Enter a valid email address.');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError('weak_password');
  }
}

function mapAuthError(error: { message?: string; status?: number }): AuthError {
  const message = error.message?.toLowerCase() ?? '';

  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return new AuthError('invalid_credentials');
  }
  if (message.includes('email not confirmed')) {
    return new AuthError('email_not_confirmed');
  }
  if (
    message.includes('already registered') ||
    message.includes('already exists') ||
    message.includes('user already registered')
  ) {
    return new AuthError('email_already_registered');
  }
  if (message.includes('password') && message.includes('least')) {
    return new AuthError('weak_password');
  }
  if (message.includes('network') || message.includes('fetch')) {
    return new AuthError('network_error');
  }

  return new AuthError('unknown', error.message);
}

function toSessionState(session: Session | null): AuthSessionState {
  return {
    session,
    user: mapSupabaseUser(session?.user ?? null),
  };
}

export const AuthService = {
  isConfigured(): boolean {
    return isSupabaseAuthReady();
  },

  hasEnvConfigured(): boolean {
    return isSupabaseConfigured;
  },

  async getSession(): Promise<AuthSessionState> {
    if (!isSupabaseConfigured) {
      return { session: null, user: null };
    }

    try {
      const client = requireClient();
      const { data, error } = await client.auth.getSession();
      if (error) {
        throw mapAuthError(error);
      }
      return toSessionState(data.session);
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('network_error');
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { user } = await this.getSession();
    return user;
  },

  async signUpWithEmail(
    email: string,
    password: string,
  ): Promise<{ user: AuthUser | null; session: Session | null }> {
    validateCredentials(email, password);
    const client = requireClient();
    const trimmedEmail = normalizeEmail(email);

    const { data, error } = await client.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (error) {
      throw mapAuthError(error);
    }

    if (data.session) {
      return {
        user: mapSupabaseUser(data.user),
        session: data.session,
      };
    }

    // Supabase still has "Confirm email" enabled — no session is returned.
    if (data.user) {
      throw new AuthError('email_confirmation_required');
    }

    throw new AuthError('unknown', 'Sign up did not return a user.');
  },

  async signInWithEmail(email: string, password: string): Promise<AuthSessionState> {
    validateCredentials(email, password);
    const client = requireClient();
    const trimmedEmail = normalizeEmail(email);

    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      throw mapAuthError(error);
    }

    return toSessionState(data.session);
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) {
      return;
    }

    const client = requireClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw mapAuthError(error);
    }
  },

  onAuthStateChange(
    callback: (state: AuthSessionState, event: AuthChangeEvent) => void,
  ): { unsubscribe: () => void } {
    const client = getSupabaseClient();
    if (!client) {
      return { unsubscribe: () => undefined };
    }

    const { data } = client.auth.onAuthStateChange((event, session) => {
      callback(toSessionState(session), event);
    });

    return { unsubscribe: () => data.subscription.unsubscribe() };
  },
};

export function getAuthErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: 'auth.signUpFailed' | 'auth.signInFailed' = 'auth.signUpFailed',
): string {
  if (!(error instanceof AuthError)) {
    return t(fallbackKey);
  }

  switch (error.code) {
    case 'invalid_credentials':
      return t('auth.invalidCredentials');
    case 'email_not_confirmed':
      return t('auth.emailNotConfirmed');
    case 'email_confirmation_required':
      return t('auth.emailConfirmationRequired');
    case 'email_already_registered':
      return t('auth.emailAlreadyRegistered');
    case 'weak_password':
      return t('auth.weakPassword');
    case 'network_error':
      return t('auth.networkError');
    case 'not_configured':
      return t('auth.notConfigured');
    default:
      return error.message?.trim() || t(fallbackKey);
  }
}
