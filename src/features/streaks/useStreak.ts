import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { StreakService } from '@/services/StreakService';
import type { StreakSummary } from '@/types/goal';

const EMPTY_STREAK: StreakSummary = {
  currentStreak: 0,
  longestStreak: 0,
  todayCompleted: false,
  yesterdayCompleted: false,
  missedYesterday: false,
  recoveryMessage: 'Start small today. One page is enough.',
};

export function useStreak() {
  const [streak, setStreak] = useState<StreakSummary>(EMPTY_STREAK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setStreak(EMPTY_STREAK);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await StreakService.getStreakSummary();
      setStreak(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load streak.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { streak, loading, error, refresh };
}
