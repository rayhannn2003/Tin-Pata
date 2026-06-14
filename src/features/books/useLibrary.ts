import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BookService } from '@/services/BookService';
import type { Book, BookAnnotationCounts, BookStatus } from '@/types';

export type LibraryBook = Book & BookAnnotationCounts;

export type LibraryFilter = 'all' | BookStatus;

export function useLibrary() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>('all');

  const loadBooks = useCallback(async () => {
    if (Platform.OS === 'web') {
      setBooks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await BookService.getLibraryBooksWithCounts();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBooks();
    }, [loadBooks]),
  );

  const importPdf = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('Import PDFs on your phone using Expo Go.');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setSuccessMessage(null);

      const book = await BookService.importPdfBook();
      if (book) {
        setSuccessMessage(`"${book.title}" added to your library.`);
        await loadBooks();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }, [loadBooks]);

  const deleteBook = useCallback(
    async (id: string) => {
      try {
        setDeletingId(id);
        setError(null);
        setSuccessMessage(null);
        await BookService.deleteBook(id);
        await loadBooks();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete book.');
      } finally {
        setDeletingId(null);
      }
    },
    [loadBooks],
  );

  const filteredBooks =
    filter === 'all' ? books : books.filter((book) => book.status === filter);

  return {
    books: filteredBooks,
    totalCount: books.length,
    loading,
    importing,
    deletingId,
    error,
    successMessage,
    filter,
    setFilter,
    importPdf,
    deleteBook,
    refresh: loadBooks,
    clearError: () => setError(null),
    clearSuccess: () => setSuccessMessage(null),
  };
}
