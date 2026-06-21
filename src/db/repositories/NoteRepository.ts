import { withDatabase } from '@/db/database';
import { getLocalWriteSyncFields } from '@/db/syncWriteHelpers';
import type { Note, NoteWithBook } from '@/types';
import { mapSyncFromRow } from '@/utils/syncMetadata';

interface NoteRow {
  id: string;
  book_id: string;
  page_number: number;
  note_text: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  device_id: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
  deleted_at: string | null;
}

function mapRow(row: NoteRow): Note {
  return {
    id: row.id,
    bookId: row.book_id,
    pageNumber: row.page_number,
    noteText: row.note_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...mapSyncFromRow(row),
  };
}

interface NoteWithBookRow extends NoteRow {
  book_title: string;
}

function mapRowWithBook(row: NoteWithBookRow): NoteWithBook {
  return {
    ...mapRow(row),
    bookTitle: row.book_title,
  };
}

const NOTES_WITH_BOOK_SELECT = `
  SELECT n.*, b.title AS book_title
  FROM notes n
  INNER JOIN books b ON b.id = n.book_id
  WHERE n.deleted_at IS NULL AND b.deleted_at IS NULL
`;

export const NoteRepository = {
  async getAllNotes(): Promise<Note[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<NoteRow>(
        'SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY created_at ASC',
      );
      return rows.map(mapRow);
    });
  },

  async getNotesByBookId(bookId: string): Promise<Note[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<NoteRow>(
        'SELECT * FROM notes WHERE book_id = ? AND deleted_at IS NULL ORDER BY page_number ASC, updated_at DESC',
        bookId,
      );
      return rows.map(mapRow);
    });
  },

  async getNotesByPage(bookId: string, pageNumber: number): Promise<Note[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<NoteRow>(
        'SELECT * FROM notes WHERE book_id = ? AND page_number = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
        bookId,
        pageNumber,
      );
      return rows.map(mapRow);
    });
  },

  async createNote(note: Note): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      await db.runAsync(
        `INSERT INTO notes (
          id, book_id, page_number, note_text, created_at, updated_at,
          user_id, device_id, sync_status, last_synced_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        note.id,
        note.bookId,
        note.pageNumber,
        note.noteText,
        note.createdAt,
        note.updatedAt ?? sync.updatedAt,
        note.userId ?? sync.userId,
        sync.deviceId,
        sync.syncStatus,
        note.lastSyncedAt,
        null,
      );
    });
  },

  async updateNote(id: string, noteText: string): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      await db.runAsync(
        `UPDATE notes SET note_text = ?, updated_at = ?, device_id = ?, sync_status = ? WHERE id = ?`,
        noteText,
        sync.updatedAt,
        sync.deviceId,
        sync.syncStatus,
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
      const row = await db.getFirstAsync<NoteRow>(
        'SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL',
        id,
      );
      return row ? mapRow(row) : null;
    });
  },

  async countByBookId(bookId: string): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM notes WHERE book_id = ? AND deleted_at IS NULL',
        bookId,
      );
      return row?.count ?? 0;
    });
  },

  async getAllNotesWithBook(): Promise<NoteWithBook[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<NoteWithBookRow>(
        `${NOTES_WITH_BOOK_SELECT} ORDER BY n.updated_at DESC`,
      );
      return rows.map(mapRowWithBook);
    });
  },

  async searchNotes(query: string): Promise<NoteWithBook[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getAllNotesWithBook();
    }

    const pattern = `%${trimmed.replace(/[%_]/g, '')}%`;
    const pageNumber = Number.parseInt(trimmed, 10);
    const hasPageMatch = Number.isFinite(pageNumber) && pageNumber > 0;

    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<NoteWithBookRow>(
        `${NOTES_WITH_BOOK_SELECT}
         AND (LOWER(n.note_text) LIKE LOWER(?)
            OR LOWER(b.title) LIKE LOWER(?)
            ${hasPageMatch ? 'OR n.page_number = ?' : ''})
         ORDER BY n.updated_at DESC`,
        ...(hasPageMatch
          ? [pattern, pattern, pageNumber]
          : [pattern, pattern]),
      );
      return rows.map(mapRowWithBook);
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
