import type { Session, User } from '@supabase/supabase-js';

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { AuthError, mapSupabaseAuthError } from '@/lib/auth/errors';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { isValidEmail, minLength } from '@/utils/validators';

const MIN_PASSWORD_LENGTH = 6;

function requireBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new AuthError('not_configured');
  }
  const client = createBrowserClient();
  if (!client) {
    throw new AuthError('not_configured');
  }
  return client;
}

function validateEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!isValidEmail(trimmed)) {
    throw new AuthError('invalid_email');
  }
  return trimmed;
}

function validatePassword(password: string): void {
  if (!minLength(password, MIN_PASSWORD_LENGTH)) {
    throw new AuthError('weak_password');
  }
}

export type SignUpResult = {
  user: User | null;
  session: Session | null;
  needsEmailConfirmation: boolean;
};

export const AuthService = {
  async signIn(email: string, password: string): Promise<{ user: User; session: Session }> {
    const trimmedEmail = validateEmail(email);
    validatePassword(password);
    const client = requireBrowserClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      throw mapSupabaseAuthError(error);
    }
    if (!data.user || !data.session) {
      throw new AuthError('unknown');
    }

    return { user: data.user, session: data.session };
  },

  async signUp(
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<SignUpResult> {
    const trimmedEmail = validateEmail(email);
    validatePassword(password);
    if (password !== confirmPassword) {
      throw new AuthError('password_mismatch');
    }

    const client = requireBrowserClient();
    const { data, error } = await client.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (error) {
      throw mapSupabaseAuthError(error);
    }

    // Prefer immediate session when email confirmation is off (Tin Pata mobile pattern).
    if (data.session && data.user) {
      return {
        user: data.user,
        session: data.session,
        needsEmailConfirmation: false,
      };
    }

    if (data.user && !data.session) {
      // Confirmation enabled — try sign-in anyway in case project already disabled it mid-signup.
      const signedIn = await client.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (!signedIn.error && signedIn.data.session && signedIn.data.user) {
        return {
          user: signedIn.data.user,
          session: signedIn.data.session,
          needsEmailConfirmation: false,
        };
      }
      return {
        user: data.user,
        session: null,
        needsEmailConfirmation: true,
      };
    }

    throw new AuthError('unknown');
  },

  async signOut(): Promise<void> {
    const client = requireBrowserClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw mapSupabaseAuthError(error);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const trimmedEmail = validateEmail(email);
    const client = requireBrowserClient();
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/reset-password`
        : undefined;

    const { error } = await client.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    if (error) {
      throw mapSupabaseAuthError(error);
    }
  },

  async resetPassword(password: string, confirmPassword: string): Promise<void> {
    validatePassword(password);
    if (password !== confirmPassword) {
      throw new AuthError('password_mismatch');
    }

    const client = requireBrowserClient();
    const { error } = await client.auth.updateUser({ password });

    if (error) {
      throw mapSupabaseAuthError(error);
    }
  },

  async getCurrentSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const client = createBrowserClient();
    if (!client) {
      return null;
    }
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw mapSupabaseAuthError(error);
    }
    return data.session;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const client = createBrowserClient();
    if (!client) {
      return null;
    }
    const { data, error } = await client.auth.getUser();
    if (error) {
      // Missing session is normal for guests.
      return null;
    }
    return data.user;
  },
};
