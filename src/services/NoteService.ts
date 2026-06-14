import { NoteRepository } from '@/db/repositories/NoteRepository';
import type { Note } from '@/types';
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/ids';

export class NoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoteError';
  }
}

export const NoteService = {
  async getBookNotes(bookId: string): Promise<Note[]> {
    return NoteRepository.getNotesByBookId(bookId);
  },

  async getPageNotes(bookId: string, pageNumber: number): Promise<Note[]> {
    return NoteRepository.getNotesByPage(bookId, pageNumber);
  },

  async deleteNote(id: string): Promise<void> {
    await NoteRepository.deleteNote(id);
  },

  async updateNote(id: string, noteText: string): Promise<Note> {
    const trimmed = noteText.trim();
    if (!trimmed) {
      throw new NoteError('Note cannot be empty.');
    }
    const existing = await NoteRepository.getNoteById(id);
    if (!existing) {
      throw new NoteError('Note not found.');
    }
    await NoteRepository.updateNote(id, trimmed);
    return {
      ...existing,
      noteText: trimmed,
      updatedAt: nowIso(),
    };
  },

  async savePageNote(bookId: string, pageNumber: number, noteText: string): Promise<Note> {
    const trimmed = noteText.trim();
    if (!trimmed) {
      throw new NoteError('Note cannot be empty.');
    }

    const page = Math.max(1, Math.floor(pageNumber));
    const existing = await NoteRepository.getNotesByPage(bookId, page);

    if (existing.length > 0) {
      const note = existing[0];
      await NoteRepository.updateNote(note.id, trimmed);
      return {
        ...note,
        noteText: trimmed,
        updatedAt: nowIso(),
      };
    }

    const now = nowIso();
    const note: Note = {
      id: await generateId(),
      bookId,
      pageNumber: page,
      noteText: trimmed,
      createdAt: now,
      updatedAt: now,
    };
    await NoteRepository.createNote(note);
    return note;
  },
};
