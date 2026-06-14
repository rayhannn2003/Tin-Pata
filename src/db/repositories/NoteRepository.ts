import { withDatabase } from '@/db/database';
import type { Note } from '@/types';

interface NoteRow {
  id: string;
  book_id: string;
  page_number: number;
  note_text: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: NoteRow): Note {
  return {
    id: row.id,
    bookId: row.book_id,
    pageNumber: row.page_number,
    noteText: row.note_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const NoteRepository = {
  async getNotesByBookId(bookId: string): Promise<Note[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<NoteRow>(
        'SELECT * FROM notes WHERE book_id = ? ORDER BY page_number ASC, updated_at DESC',
        bookId,
      );
      return rows.map(mapRow);
    });
  },

  async getNotesByPage(bookId: string, pageNumber: number): Promise<Note[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<NoteRow>(
        'SELECT * FROM notes WHERE book_id = ? AND page_number = ? ORDER BY updated_at DESC',
        bookId,
        pageNumber,
      );
      return rows.map(mapRow);
    });
  },

  async createNote(note: Note): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync(
        'INSERT INTO notes (id, book_id, page_number, note_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        note.id,
        note.bookId,
        note.pageNumber,
        note.noteText,
        note.createdAt,
        note.updatedAt,
      );
    });
  },

  async updateNote(id: string, noteText: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync(
        'UPDATE notes SET note_text = ?, updated_at = ? WHERE id = ?',
        noteText,
        new Date().toISOString(),
        id,
      );
    });
  },

  async deleteNote(id: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM notes WHERE id = ?', id);
    });
  },

  async deleteNotesByBookId(bookId: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM notes WHERE book_id = ?', bookId);
    });
  },

  async getNoteById(id: string): Promise<Note | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', id);
      return row ? mapRow(row) : null;
    });
  },

  async countByBookId(bookId: string): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM notes WHERE book_id = ?',
        bookId,
      );
      return row?.count ?? 0;
    });
  },

  /** @deprecated Use getNotesByBookId */
  async findByBookId(bookId: string): Promise<Note[]> {
    return this.getNotesByBookId(bookId);
  },

  /** @deprecated Use createNote */
  async insert(note: Note): Promise<void> {
    return this.createNote(note);
  },

  /** @deprecated Use updateNote */
  async update(id: string, noteText: string): Promise<void> {
    return this.updateNote(id, noteText);
  },

  /** @deprecated Use deleteNote */
  async delete(id: string): Promise<void> {
    return this.deleteNote(id);
  },
};
