import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import type { AuthUser, Profile } from '@/types/auth';

interface AuthContextValue {
  loading: boolean;
  isConfigured: boolean;
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const isConfigured = AuthService.isConfigured();

  const loadProfile = useCallback(async (authUser: AuthUser | null) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    try {
      const next = await ProfileService.ensureProfile(authUser.id, authUser.email);
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, []);

  const applySession = useCallback(
    async (nextSession: Session | null, nextUser: AuthUser | null) => {
      setSession(nextSession);
      setUser(nextUser);
      await loadProfile(nextUser);
    },
    [loadProfile],
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const state = await AuthService.getSession();
        if (!active) {
          return;
        }
        await applySession(state.session, state.user);
      } catch {
        // Offline or network error — app stays usable in local-only mode.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    if (!isConfigured) {
      return () => {
        active = false;
      };
    }

    const subscription = AuthService.onAuthStateChange((state) => {
      void applySession(state.session, state.user);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession, isConfigured]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const state = await AuthService.signInWithEmail(email, password);
      await applySession(state.session, state.user);
    },
    [applySession],
  );

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await AuthService.signUpWithEmail(email, password);
    await applySession(result.session, result.user);
  }, [applySession]);

  const signOut = useCallback(async () => {
    await AuthService.signOut();
    await applySession(null, null);
  }, [applySession]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(user);
  }, [loadProfile, user]);

  const value = useMemo(
    () => ({
      loading,
      isConfigured,
      user,
      session,
      profile,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [loading, isConfigured, user, session, profile, signIn, signUp, signOut, refreshProfile],
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
