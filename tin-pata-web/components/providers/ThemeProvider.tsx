'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { UserSettingsService } from '@/services/UserSettingsService';
import { READER_SETTING_KEYS } from '@/types/reader';
import { storage } from '@/utils/storage';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const LOCAL_THEME_KEY = 'tin-pata.theme';

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  root.dataset.theme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = storage.get(LOCAL_THEME_KEY);
      if (isTheme(local)) {
        setThemeState(local);
        applyTheme(local);
      }

      try {
        const prefs = await UserSettingsService.getMany([READER_SETTING_KEYS.theme]);
        const remote = prefs[READER_SETTING_KEYS.theme];
        if (!cancelled && isTheme(remote)) {
          setThemeState(remote);
          applyTheme(remote);
          storage.set(LOCAL_THEME_KEY, remote);
        }
      } catch {
        // offline / unauthenticated — keep local
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyTheme(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function onChange() {
      if (theme === 'system') {
        applyTheme('system');
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme, ready]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    storage.set(LOCAL_THEME_KEY, next);
    applyTheme(next);
    void UserSettingsService.set(READER_SETTING_KEYS.theme, next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, ready }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
