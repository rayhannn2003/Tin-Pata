import { useThemeContext } from '@/hooks/ThemeProvider';
import { Colors, type ColorScheme } from '@/constants/theme';

export function useColorScheme(): ColorScheme {
  const { colorScheme } = useThemeContext();
  return colorScheme;
}

export function useThemeColors() {
  const scheme = useColorScheme();
  return Colors[scheme];
}

export function useThemePreference() {
  const { preference, setPreference, loading, refresh } = useThemeContext();
  return { preference, setPreference, loading, refresh };
}
