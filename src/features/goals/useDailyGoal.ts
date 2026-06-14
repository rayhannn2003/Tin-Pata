import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { GoalService } from '@/services/GoalService';
import type { DailyGoal } from '@/types';

export function useDailyGoal() {
  const [goal, setGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setGoal(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const active = await GoalService.ensureDefaultGoal();
      setGoal(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load goal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { goal, loading, error, refresh };
}
