import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BookmarkService } from '@/services/BookmarkService';
import { BookService } from '@/services/BookService';
import type { BookmarkWithBook } from '@/types';

const SEARCH_DEBOUNCE_MS = 300;

export function useAllBookmarks(search: string, bookId?: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (Platform.OS === 'web') {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = debouncedSearch.trim()
        ? await BookmarkService.searchBookmarks(debouncedSearch)
        : bookId
          ? (await BookmarkService.getBookBookmarks(bookId)).map((bookmark) => ({
              ...bookmark,
              bookTitle: '',
            }))
          : await BookmarkService.getAllBookmarksWithBook();

      if (bookId) {
        const book = await BookService.getBookById(bookId);
        const bookTitle = book?.title ?? '';
        setBookmarks(
          (debouncedSearch.trim()
            ? data.filter((item) => item.bookId === bookId)
            : data
          ).map((item) => ({
            ...item,
            bookTitle: item.bookTitle || bookTitle,
          })),
        );
      } else {
        setBookmarks(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookmarks.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, bookId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { bookmarks, loading, error, refresh: load };
}
