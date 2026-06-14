import { useCallback, useEffect, useState } from 'react';

import { BookService } from '@/services/BookService';
import type { Book } from '@/types';

export function useBook(bookId: string | undefined) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!bookId) {
      setBook(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await BookService.getBookById(bookId);
      setBook(result);
      if (!result) {
        setError('Book not found.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load book.');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { book, loading, error, refresh: load };
}
