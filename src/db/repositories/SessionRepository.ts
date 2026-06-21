import { withDatabase } from '@/db/database';
import { getLocalWriteSyncFields } from '@/db/syncWriteHelpers';
import type { Mood, ReadingSession } from '@/types';
import { mapSyncFromRow } from '@/utils/syncMetadata';

interface SessionRow {
  id: string;
  book_id: string;
  start_page: number;
  end_page: number;
  pages_read: number;
  duration_seconds: number;
  focus_level: number | null;
  mood: Mood | null;
  blocker_reason: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
  device_id: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
  deleted_at: string | null;
}

function mapRow(row: SessionRow): ReadingSession {
  return {
    id: row.id,
    bookId: row.book_id,
    startPage: row.start_page,
    endPage: row.end_page,
    pagesRead: row.pages_read,
    durationSeconds: row.duration_seconds,
    focusLevel: row.focus_level,
    mood: row.mood,
    blockerReason: row.blocker_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    ...mapSyncFromRow(row),
  };
}

export const SessionRepository = {
  async getAllSessions(): Promise<ReadingSession[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<SessionRow>(
        'SELECT * FROM reading_sessions WHERE deleted_at IS NULL ORDER BY created_at DESC',
      );
      return rows.map(mapRow);
    });
  },

  async getSessionsByBookId(bookId: string): Promise<ReadingSession[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<SessionRow>(
        'SELECT * FROM reading_sessions WHERE book_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        bookId,
      );
      return rows.map(mapRow);
    });
  },

  async getTodaySessions(startIso: string, endIso: string): Promise<ReadingSession[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<SessionRow>(
        `SELECT * FROM reading_sessions
         WHERE created_at >= ? AND created_at < ? AND deleted_at IS NULL
         ORDER BY created_at DESC`,
        startIso,
        endIso,
      );
      return rows.map(mapRow);
    });
  },

  async getSessionsByDateRange(startIso: string, endIso: string): Promise<ReadingSession[]> {
    return this.getTodaySessions(startIso, endIso);
  },

  async createSession(session: ReadingSession): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      await db.runAsync(
        `INSERT INTO reading_sessions (
          id, book_id, start_page, end_page, pages_read,
          duration_seconds, focus_level, mood, blocker_reason, created_at,
          user_id, device_id, sync_status, last_synced_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        session.id,
        session.bookId,
        session.startPage,
        session.endPage,
        session.pagesRead,
        session.durationSeconds,
        session.focusLevel,
        session.mood,
        session.blockerReason,
        session.createdAt,
        session.userId ?? sync.userId,
        sync.deviceId,
        sync.syncStatus,
        session.lastSyncedAt,
        sync.updatedAt,
        null,
      );
    });
  },

  async deleteSession(id: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM reading_sessions WHERE id = ?', id);
    });
  },

  async getSessionById(id: string): Promise<ReadingSession | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<SessionRow>(
        'SELECT * FROM reading_sessions WHERE id = ? AND deleted_at IS NULL',
        id,
      );
      return row ? mapRow(row) : null;
    });
  },

  async deleteByBookId(bookId: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM reading_sessions WHERE book_id = ?', bookId);
    });
  },

  /** @deprecated Use getAllSessions */
  async findAll(): Promise<ReadingSession[]> {
    return this.getAllSessions();
  },

  /** @deprecated Use getSessionsByBookId */
  async findByBookId(bookId: string): Promise<ReadingSession[]> {
    return this.getSessionsByBookId(bookId);
  },

  /** @deprecated Use createSession */
  async insert(session: ReadingSession): Promise<void> {
    return this.createSession(session);
  },
};
