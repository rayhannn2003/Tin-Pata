import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BookmarkService } from '@/services/BookmarkService';
import type { Bookmark } from '@/types';

export function useBookmarks(bookId: string | undefined) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web' || !bookId) {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await BookmarkService.getBookBookmarks(bookId);
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookmarks.');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const isPageBookmarked = useCallback(
    (pageNumber: number) => bookmarks.some((b) => b.pageNumber === pageNumber),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    async (pageNumber: number) => {
      if (!bookId) {
        return null;
      }
      const result = await BookmarkService.toggleBookmark(bookId, pageNumber);
      await refresh();
      return result;
    },
    [bookId, refresh],
  );

  const deleteBookmark = useCallback(
    async (id: string) => {
      await BookmarkService.deleteBookmark(id);
      await refresh();
    },
    [refresh],
  );

  return {
    bookmarks,
    loading,
    error,
    refresh,
    isPageBookmarked,
    toggleBookmark,
    deleteBookmark,
  };
}
