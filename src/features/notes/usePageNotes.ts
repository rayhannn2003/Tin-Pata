import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { NoteService } from '@/services/NoteService';
import type { Note } from '@/types';

export function usePageNotes(bookId: string | undefined, pageNumber: number) {
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
      const data = await NoteService.getPageNotes(bookId, pageNumber);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  }, [bookId, pageNumber]);

  const primaryNote = notes[0] ?? null;

  const saveNote = useCallback(
    async (text: string) => {
      if (!bookId) {
        return null;
      }
      const saved = await NoteService.savePageNote(bookId, pageNumber, text);
      await refresh();
      return saved;
    },
    [bookId, pageNumber, refresh],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await NoteService.deleteNote(id);
      await refresh();
    },
    [refresh],
  );

  return {
    notes,
    primaryNote,
    loading,
    error,
    refresh,
    saveNote,
    deleteNote,
  };
}
