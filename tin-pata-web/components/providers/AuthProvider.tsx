'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';
import { AuthService } from '@/services/AuthService';
import { ROUTES } from '@/utils/constants';
import { isSupabaseConfigured } from '@/lib/supabase/config';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authenticated: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await AuthService.getCurrentSession();
      applySession(next);
    } catch {
      applySession(null);
    }
  }, [applySession]);

  useEffect(() => {
    if (!isConfigured) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let active = true;
    const client = createClient();
    if (!client) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    void (async () => {
      try {
        const { data } = await client.auth.getSession();
        if (!active) {
          return;
        }
        applySession(data.session);
      } catch {
        if (active) {
          applySession(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession, isConfigured]);

  const signOut = useCallback(async () => {
    try {
      await AuthService.signOut();
    } finally {
      applySession(null);
      router.replace(ROUTES.signIn);
      router.refresh();
    }
  }, [applySession, router]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      authenticated: Boolean(session && user),
      isConfigured,
      signOut,
      refresh,
    }),
    [user, session, loading, isConfigured, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useUser(): User | null {
  return useAuth().user;
}
