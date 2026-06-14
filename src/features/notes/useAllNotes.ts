import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { NoteService } from '@/services/NoteService';
import { BookService } from '@/services/BookService';
import type { NoteWithBook } from '@/types';

export function useAllNotes(search: string, bookId?: string) {
  const [notes, setNotes] = useState<NoteWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (Platform.OS === 'web') {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = search.trim()
        ? await NoteService.searchNotes(search)
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
          (search.trim() ? data.filter((note) => note.bookId === bookId) : data).map((note) => ({
            ...note,
            bookTitle: note.bookTitle || bookTitle,
          })),
        );
      } else {
        setNotes(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notes.');
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

  return { notes, loading, error, refresh: load };
}
