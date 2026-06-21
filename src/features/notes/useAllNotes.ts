import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { NoteService } from '@/services/NoteService';
import { BookService } from '@/services/BookService';
import type { NoteWithBook } from '@/types';

const SEARCH_DEBOUNCE_MS = 300;

export function useAllNotes(search: string, bookId?: string) {
  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    if (Platform.OS === 'web') {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = debouncedSearch.trim()
        ? await NoteService.searchNotes(debouncedSearch)
        : bookId
          ? (await NoteService.getBookNotes(bookId)).map((note) => ({
              ...note,
              bookTitle: '',
            }))
          : await NoteService.getAllNotesWithBook();

      if (bookId) {
        const book = await BookService.getBookById(bookId);
        const bookTitle = book?.title ?? '';
        setNotes(
          (debouncedSearch.trim() ? data.filter((note) => note.bookId === bookId) : data).map(
            (note) => ({
              ...note,
              bookTitle: note.bookTitle || bookTitle,
            }),
          ),
        );
      } else {
        setNotes(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, bookId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { notes, loading, error, refresh: load };
}
