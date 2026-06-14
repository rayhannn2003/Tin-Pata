import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ReadingSessionService } from '@/services/ReadingSessionService';
import type { TodayReadingSummary } from '@/types/session';

const EMPTY_SUMMARY: TodayReadingSummary = {
  totalMinutes: 0,
  totalPages: 0,
  sessionCount: 0,
};

export function useTodayReadingSummary() {
  const [summary, setSummary] = useState<TodayReadingSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setSummary(EMPTY_SUMMARY);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await ReadingSessionService.getTodayReadingSummary();
      setSummary(data);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { summary, loading, refresh };
}
