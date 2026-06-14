import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { BookStatsService } from '@/services/BookStatsService';
import { BookService } from '@/services/BookService';
import type { BookStatsWithSessions } from '@/types/bookStats';
import type { BookAnnotationCounts } from '@/types';

export function useBookStats(bookId: string | undefined) {
  const [stats, setStats] = useState<BookStatsWithSessions | null>(null);
  const [counts, setCounts] = useState<BookAnnotationCounts>({ bookmarkCount: 0, noteCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!bookId) {
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [result, annotationCounts] = await Promise.all([
        BookStatsService.getBookStatsWithSessions(bookId),
        BookService.getBookAnnotationCounts(bookId),
      ]);
      setStats(result);
      setCounts(annotationCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load book stats.');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { stats, counts, loading, error, refresh };
}
