import { getDatabase } from '@/db/database';
import type { Mood, ReadingSession } from '@/types';

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
  };
}

export const SessionRepository = {
  async getAllSessions(): Promise<ReadingSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SessionRow>(
      'SELECT * FROM reading_sessions ORDER BY created_at DESC',
    );
    return rows.map(mapRow);
  },

  async getSessionsByBookId(bookId: string): Promise<ReadingSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SessionRow>(
      'SELECT * FROM reading_sessions WHERE book_id = ? ORDER BY created_at DESC',
      bookId,
    );
    return rows.map(mapRow);
  },

  async getTodaySessions(startIso: string, endIso: string): Promise<ReadingSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SessionRow>(
      `SELECT * FROM reading_sessions
       WHERE created_at >= ? AND created_at < ?
       ORDER BY created_at DESC`,
      startIso,
      endIso,
    );
    return rows.map(mapRow);
  },

  async getSessionsByDateRange(startIso: string, endIso: string): Promise<ReadingSession[]> {
    return this.getTodaySessions(startIso, endIso);
  },

  async createSession(session: ReadingSession): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO reading_sessions (
        id, book_id, start_page, end_page, pages_read,
        duration_seconds, focus_level, mood, blocker_reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    );
  },

  async deleteSession(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM reading_sessions WHERE id = ?', id);
  },

  async deleteByBookId(bookId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM reading_sessions WHERE book_id = ?', bookId);
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
