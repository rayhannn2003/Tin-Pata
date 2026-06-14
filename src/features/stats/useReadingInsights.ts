import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ReadingInsightsService } from '@/services/ReadingInsightsService';
import { EMPTY_READING_INSIGHTS, type ReadingInsights } from '@/types/insights';

export function useReadingInsights() {
  const [insights, setInsights] = useState<ReadingInsights>(EMPTY_READING_INSIGHTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setInsights(EMPTY_READING_INSIGHTS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await ReadingInsightsService.getReadingInsights();
      setInsights(data);
    } catch {
      setInsights(EMPTY_READING_INSIGHTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { insights, loading, refresh };
}
