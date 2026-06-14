import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ReadingSessionService } from '@/services/ReadingSessionService';
import type { ReadingStatsSummary } from '@/types/session';

const EMPTY_STATS: ReadingStatsSummary = {
  totalSessions: 0,
  totalMinutes: 0,
  totalPages: 0,
  todayMinutes: 0,
  todayPages: 0,
};

export function useReadingStats() {
  const [stats, setStats] = useState<ReadingStatsSummary>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await ReadingSessionService.getReadingStatsSummary();
      setStats(data);
    } catch {
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { stats, loading, refresh };
}
