import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors, type ColorScheme } from '@/constants/theme';
import { ThemeService } from '@/services/ThemeService';
import type { ThemePreference } from '@/types/theme';

interface ThemeContextValue {
  preference: ThemePreference;
  colorScheme: ColorScheme;
  loading: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
  refresh: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): ColorScheme {
  if (preference === 'light') {
    return 'light';
  }
  if (preference === 'dark') {
    return 'dark';
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const stored = await ThemeService.getPreference();
      setPreferenceState(stored);
    } catch {
      setPreferenceState('system');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setPreference = useCallback(async (next: ThemePreference) => {
    await ThemeService.setPreference(next);
    setPreferenceState(next);
  }, []);

  const colorScheme = resolveColorScheme(preference, systemScheme);

  const value = useMemo(
    () => ({
      preference,
      colorScheme,
      loading,
      setPreference,
      refresh,
    }),
    [colorScheme, loading, preference, refresh, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
}

export function useColorScheme(): ColorScheme {
  const { colorScheme } = useThemeContext();
  return colorScheme;
}

export function useThemeColors() {
  const scheme = useColorScheme();
  return Colors[scheme];
}
