import type { Book, BookReadingStats, BookStatus } from '@/types/book';
import {
  parseBookCategory,
  parseBookPriority,
  parseBookStatus,
} from '@/types/book';
import type { Bookmark } from '@/types/bookmark';
import type { Note } from '@/types/note';
import type { ReadingSession } from '@/types/session';
import { createClient } from '@/lib/supabase/server';

interface BookRow {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  total_pages: number;
  current_page: number;
  current_page_updated_at: string | null;
  status: string;
  category: string;
  priority: string;
  cloud_storage_path: string | null;
  pdf_file_name: string | null;
  pdf_file_size: number | null;
  pdf_cloud_available: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

function mapBook(
  row: BookRow,
  counts: { bookmarkCount: number; noteCount: number } = { bookmarkCount: 0, noteCount: 0 },
): Book {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    author: row.author,
    status: parseBookStatus(row.status),
    category: parseBookCategory(row.category),
    priority: parseBookPriority(row.priority),
    totalPages: row.total_pages ?? 0,
    currentPage: Math.max(1, row.current_page ?? 1),
    currentPageUpdatedAt: row.current_page_updated_at,
    pdfFileName: row.pdf_file_name,
    pdfFileSize: row.pdf_file_size,
    cloudStoragePath: row.cloud_storage_path,
    pdfCloudAvailable: Boolean(row.pdf_cloud_available),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    lastReadAt: row.current_page_updated_at ?? row.updated_at,
    bookmarkCount: counts.bookmarkCount,
    noteCount: counts.noteCount,
  };
}

async function requireAuthedClient() {
  const client = await createClient();
  if (!client) {
    return null;
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return null;
  }
  return { client, userId: user.id };
}

export const BookService = {
  async listForCurrentUser(): Promise<Book[]> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return [];
    }
    const { client, userId } = ctx;

    const { data: books, error } = await client
      .from('books')
      .select(
        'id, user_id, title, author, total_pages, current_page, current_page_updated_at, status, category, priority, cloud_storage_path, pdf_file_name, pdf_file_size, pdf_cloud_available, created_at, updated_at, deleted_at',
      )
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error || !books) {
      console.error('BookService.listForCurrentUser', error?.message);
      return [];
    }

    const bookIds = books.map((b) => b.id);
    if (bookIds.length === 0) {
      return [];
    }

    const [notesRes, bookmarksRes] = await Promise.all([
      client
        .from('notes')
        .select('book_id')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('book_id', bookIds),
      client
        .from('bookmarks')
        .select('book_id')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('book_id', bookIds),
    ]);

    const noteCounts = new Map<string, number>();
    const bookmarkCounts = new Map<string, number>();
    for (const row of notesRes.data ?? []) {
      noteCounts.set(row.book_id, (noteCounts.get(row.book_id) ?? 0) + 1);
    }
    for (const row of bookmarksRes.data ?? []) {
      bookmarkCounts.set(row.book_id, (bookmarkCounts.get(row.book_id) ?? 0) + 1);
    }

    return (books as BookRow[]).map((row) =>
      mapBook(row, {
        noteCount: noteCounts.get(row.id) ?? 0,
        bookmarkCount: bookmarkCounts.get(row.id) ?? 0,
      }),
    );
  },

  async getByIdForCurrentUser(bookId: string): Promise<Book | null> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return null;
    }
    const { client, userId } = ctx;

    const { data, error } = await client
      .from('books')
      .select(
        'id, user_id, title, author, total_pages, current_page, current_page_updated_at, status, category, priority, cloud_storage_path, pdf_file_name, pdf_file_size, pdf_cloud_available, created_at, updated_at, deleted_at',
      )
      .eq('user_id', userId)
      .eq('id', bookId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const [notesRes, bookmarksRes] = await Promise.all([
      client
        .from('notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .is('deleted_at', null),
      client
        .from('bookmarks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .is('deleted_at', null),
    ]);

    return mapBook(data as BookRow, {
      noteCount: notesRes.count ?? 0,
      bookmarkCount: bookmarksRes.count ?? 0,
    });
  },

  async rename(bookId: string, title: string): Promise<{ ok: boolean; error?: string }> {
    const trimmed = title.trim();
    if (!trimmed) {
      return { ok: false, error: 'Title cannot be empty.' };
    }
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const { error } = await ctx.client
      .from('books')
      .update({ title: trimmed, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .eq('user_id', ctx.userId)
      .is('deleted_at', null);

    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async updateStatus(bookId: string, status: BookStatus): Promise<{ ok: boolean; error?: string }> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const { error } = await ctx.client
      .from('books')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .eq('user_id', ctx.userId)
      .is('deleted_at', null);

    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async softDelete(bookId: string): Promise<{ ok: boolean; error?: string }> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const { error } = await ctx.client
      .from('books')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', bookId)
      .eq('user_id', ctx.userId)
      .is('deleted_at', null);

    return error ? { ok: false, error: error.message } : { ok: true };
  },
};

export const LibraryAnnotationService = {
  async listRecentNotes(bookId: string, limit = 5): Promise<Note[]> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return [];
    }
    const { data, error } = await ctx.client
      .from('notes')
      .select('id, user_id, book_id, page_number, note_text, created_at, updated_at, deleted_at')
      .eq('user_id', ctx.userId)
      .eq('book_id', bookId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }
    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      bookId: row.book_id,
      pageNumber: row.page_number,
      noteText: row.note_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
  },

  async listRecentBookmarks(bookId: string, limit = 5): Promise<Bookmark[]> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return [];
    }
    const { data, error } = await ctx.client
      .from('bookmarks')
      .select('id, user_id, book_id, page_number, title, created_at, updated_at, deleted_at')
      .eq('user_id', ctx.userId)
      .eq('book_id', bookId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }
    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      bookId: row.book_id,
      pageNumber: row.page_number,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
  },

  async listRecentSessions(bookId: string, limit = 8): Promise<ReadingSession[]> {
    const ctx = await requireAuthedClient();
    if (!ctx) {
      return [];
    }
    const { data, error } = await ctx.client
      .from('reading_sessions')
      .select(
        'id, user_id, book_id, start_page, end_page, pages_read, duration_seconds, focus_level, mood, blocker_reason, created_at, updated_at, deleted_at',
      )
      .eq('user_id', ctx.userId)
      .eq('book_id', bookId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }
    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      bookId: row.book_id,
      startPage: row.start_page,
      endPage: row.end_page,
      pagesRead: row.pages_read,
      durationSeconds: row.duration_seconds,
      focusLevel: row.focus_level,
      mood: row.mood,
      blockerReason: row.blocker_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    }));
  },

  async computeBookStats(bookId: string): Promise<BookReadingStats> {
    const sessions = await this.listRecentSessions(bookId, 500);
    return this.statsFromSessions(sessions);
  },

  statsFromSessions(sessions: ReadingSession[]): BookReadingStats {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        totalPagesRead: 0,
        averagePagesPerSession: 0,
        averageMinutesPerSession: 0,
        longestSessionMinutes: 0,
        firstReadAt: null,
        lastReadAt: null,
      };
    }

    const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    const totalPages = sessions.reduce((sum, s) => sum + Math.max(0, s.pagesRead), 0);
    const longestSeconds = sessions.reduce((max, s) => Math.max(max, s.durationSeconds), 0);
    const chron = [...sessions].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );

    return {
      totalSessions: sessions.length,
      totalMinutes: Math.round(totalSeconds / 60),
      totalPagesRead: totalPages,
      averagePagesPerSession: Math.round((totalPages / sessions.length) * 10) / 10,
      averageMinutesPerSession: Math.round(totalSeconds / 60 / sessions.length),
      longestSessionMinutes: Math.round(longestSeconds / 60),
      firstReadAt: chron[0]?.createdAt ?? null,
      lastReadAt: chron[chron.length - 1]?.createdAt ?? null,
    };
  },
};
