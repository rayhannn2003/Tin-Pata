import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { GoalService } from '@/services/GoalService';
import type { DailyGoal } from '@/types';
import type { GoalProgress } from '@/types/goal';

const EMPTY_PROGRESS: GoalProgress = {
  goalType: 'pages',
  targetValue: 5,
  currentValue: 0,
  percentage: 0,
  isCompleted: false,
  remainingValue: 5,
  message: 'Small progress counts.',
};

export function useGoalProgress() {
  const [goal, setGoal] = useState<DailyGoal | null>(null);
  const [progress, setProgress] = useState<GoalProgress>(EMPTY_PROGRESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setGoal(null);
      setProgress(EMPTY_PROGRESS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await GoalService.getTodayGoalProgress();
      setGoal(result.goal);
      setProgress(result.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load goal progress.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { goal, progress, loading, error, refresh };
}
