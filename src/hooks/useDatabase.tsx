import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors, type ColorScheme } from '@/constants/theme';
import { getDatabaseEpoch, initializeDatabase } from '@/db/database';
import { ThemedText } from '@/components/ui/ThemedText';

interface DatabaseContextValue {
  isReady: boolean;
  error: Error | null;
  retry: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isReady: false,
  error: null,
  retry: () => {},
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const systemScheme = useSystemColorScheme();
  const colorScheme: ColorScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[colorScheme];

  const init = useCallback(async () => {
    setIsReady(false);
    setError(null);
    try {
      await initializeDatabase();
      setIsReady(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Database initialization failed'));
    }
  }, []);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    let seenEpoch = getDatabaseEpoch();
    const timer = setInterval(() => {
      const epoch = getDatabaseEpoch();
      if (epoch !== seenEpoch) {
        seenEpoch = epoch;
        void init();
      }
    }, 300);
    return () => clearInterval(timer);
  }, [init]);

  const value = useMemo(
    () => ({ isReady, error, retry: init }),
    [isReady, error, init],
  );

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ThemedText variant="subtitle">Could not open database</ThemedText>
        <ThemedText variant="caption" secondary style={styles.errorMessage}>
          {error.message}
        </ThemedText>
        <Pressable onPress={init} style={[styles.retry, { borderColor: colors.tint }]}>
          <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>Retry</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} size="large" />
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabase() {
  return useContext(DatabaseContext);
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorMessage: { textAlign: 'center' },
  retry: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});
