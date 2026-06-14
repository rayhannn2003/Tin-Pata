import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { NoteService } from '@/services/NoteService';
import type { Note } from '@/types';

export function useBookNotes(bookId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web' || !bookId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await NoteService.getBookNotes(bookId);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await NoteService.deleteNote(id);
      await refresh();
    },
    [refresh],
  );

  return { notes, loading, error, refresh, deleteNote };
}
