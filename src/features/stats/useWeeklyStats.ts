import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { WeeklyStatsService } from '@/services/WeeklyStatsService';
import type { WeeklyStatsSummary } from '@/types/goal';

const EMPTY_WEEKLY: WeeklyStatsSummary = {
  totalPagesThisWeek: 0,
  totalMinutesThisWeek: 0,
  totalSessionsThisWeek: 0,
  readingDaysThisWeek: 0,
  completedGoalDaysThisWeek: 0,
  bestReadingDay: null,
  dailyBreakdown: [],
  habitCalendar: [],
};

export function useWeeklyStats() {
  const [weekly, setWeekly] = useState<WeeklyStatsSummary>(EMPTY_WEEKLY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setWeekly(EMPTY_WEEKLY);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await WeeklyStatsService.getWeeklyStats();
      setWeekly(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load weekly stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { weekly, loading, error, refresh };
}
