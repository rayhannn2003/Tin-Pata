import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { getSupabaseClient, isSupabaseAuthReady, isSupabaseConfigured } from '@/lib/supabase';
import {
  AuthError,
  mapSupabaseUser,
  type AuthSessionState,
  type AuthUser,
} from '@/types/auth';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new AuthError('not_configured', 'Supabase is not configured.');
  }
  return client;
}

function mapAuthError(error: { message?: string; status?: number }): AuthError {
  const message = error.message?.toLowerCase() ?? '';

  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return new AuthError('invalid_credentials');
  }
  if (message.includes('email not confirmed')) {
    return new AuthError('email_not_confirmed');
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
    const client = requireClient();
    const trimmedEmail = email.trim().toLowerCase();

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

    // No email confirmation: sign in immediately after sign-up.
    const signedIn = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (signedIn.error) {
      throw mapAuthError(signedIn.error);
    }

    return {
      user: mapSupabaseUser(signedIn.data.user),
      session: signedIn.data.session,
    };
  },

  async signInWithEmail(email: string, password: string): Promise<AuthSessionState> {
    const client = requireClient();
    const trimmedEmail = email.trim().toLowerCase();

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
