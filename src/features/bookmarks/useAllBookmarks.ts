import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BookmarkService } from '@/services/BookmarkService';
import { BookService } from '@/services/BookService';
import type { BookmarkWithBook } from '@/types';

export function useAllBookmarks(search: string, bookId?: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (Platform.OS === 'web') {
      setBookmarks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = search.trim()
        ? await BookmarkService.searchBookmarks(search)
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
          (search.trim() ? data.filter((item) => item.bookId === bookId) : data).map((item) => ({
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
  }, [search, bookId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return { bookmarks, loading, error, refresh: load };
}
