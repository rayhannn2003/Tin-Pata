import { createClient } from '@/lib/supabase/client';
import type { Bookmark } from '@/types/bookmark';
import type { BookStatus } from '@/types/book';
import type { Note } from '@/types/note';
import { getOrCreateWebDeviceId } from '@/utils/deviceId';

async function requireUser() {
  const client = createClient();
  if (!client) {
    return null;
  }
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return null;
  }
  return { client, userId: user.id, deviceId: getOrCreateWebDeviceId() };
}

export const ReaderSyncService = {
  async updateProgress(options: {
    bookId: string;
    currentPage: number;
    totalPages: number;
    previousStatus: BookStatus;
  }): Promise<{ ok: boolean; error?: string }> {
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const page = Math.max(1, Math.min(options.currentPage, Math.max(1, options.totalPages || options.currentPage)));
    const status: BookStatus =
      options.previousStatus === 'finished'
        ? 'finished'
        : options.previousStatus === 'paused'
          ? 'paused'
          : 'reading';

    const { error } = await ctx.client
      .from('books')
      .update({
        current_page: page,
        current_page_updated_at: now,
        status,
        updated_at: now,
      })
      .eq('id', options.bookId)
      .eq('user_id', ctx.userId)
      .is('deleted_at', null);

    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async listBookmarks(bookId: string): Promise<Bookmark[]> {
    const ctx = await requireUser();
    if (!ctx) {
      return [];
    }
    const { data, error } = await ctx.client
      .from('bookmarks')
      .select('id, user_id, book_id, page_number, title, created_at, updated_at, deleted_at')
      .eq('user_id', ctx.userId)
      .eq('book_id', bookId)
      .is('deleted_at', null)
      .order('page_number', { ascending: true });

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

  async createBookmark(bookId: string, pageNumber: number, title?: string): Promise<{ ok: boolean; bookmark?: Bookmark; error?: string }> {
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const row = {
      id,
      user_id: ctx.userId,
      device_id: ctx.deviceId,
      book_id: bookId,
      page_number: pageNumber,
      title: title?.trim() || `Page ${pageNumber}`,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    const { error } = await ctx.client.from('bookmarks').insert(row);
    if (error) {
      return { ok: false, error: error.message };
    }
    return {
      ok: true,
      bookmark: {
        id,
        userId: ctx.userId,
        bookId,
        pageNumber,
        title: row.title,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    };
  },

  async deleteBookmark(bookmarkId: string): Promise<{ ok: boolean; error?: string }> {
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const { error } = await ctx.client
      .from('bookmarks')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', bookmarkId)
      .eq('user_id', ctx.userId);
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async listNotes(bookId: string): Promise<Note[]> {
    const ctx = await requireUser();
    if (!ctx) {
      return [];
    }
    const { data, error } = await ctx.client
      .from('notes')
      .select('id, user_id, book_id, page_number, note_text, created_at, updated_at, deleted_at')
      .eq('user_id', ctx.userId)
      .eq('book_id', bookId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

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

  async createNote(bookId: string, pageNumber: number, noteText: string): Promise<{ ok: boolean; note?: Note; error?: string }> {
    const trimmed = noteText.trim();
    if (!trimmed) {
      return { ok: false, error: 'Note cannot be empty.' };
    }
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const { error } = await ctx.client.from('notes').insert({
      id,
      user_id: ctx.userId,
      device_id: ctx.deviceId,
      book_id: bookId,
      page_number: pageNumber,
      note_text: trimmed,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return {
      ok: true,
      note: {
        id,
        userId: ctx.userId,
        bookId,
        pageNumber,
        noteText: trimmed,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    };
  },

  async updateNote(noteId: string, noteText: string): Promise<{ ok: boolean; error?: string }> {
    const trimmed = noteText.trim();
    if (!trimmed) {
      return { ok: false, error: 'Note cannot be empty.' };
    }
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const { error } = await ctx.client
      .from('notes')
      .update({ note_text: trimmed, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', ctx.userId)
      .is('deleted_at', null);
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async deleteNote(noteId: string): Promise<{ ok: boolean; error?: string }> {
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const { error } = await ctx.client
      .from('notes')
      .update({ deleted_at: now, updated_at: now })
      .eq('id', noteId)
      .eq('user_id', ctx.userId);
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async finishSession(options: {
    bookId: string;
    startPage: number;
    endPage: number;
    durationSeconds: number;
  }): Promise<{ ok: boolean; error?: string }> {
    const pagesRead = Math.max(0, Math.abs(options.endPage - options.startPage));
    if (options.durationSeconds < 60 && pagesRead <= 0) {
      return { ok: true };
    }
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const { error } = await ctx.client.from('reading_sessions').insert({
      id: crypto.randomUUID(),
      user_id: ctx.userId,
      device_id: ctx.deviceId,
      book_id: options.bookId,
      start_page: options.startPage,
      end_page: options.endPage,
      pages_read: pagesRead || (options.endPage !== options.startPage ? pagesRead : 0),
      duration_seconds: Math.max(0, Math.round(options.durationSeconds)),
      focus_level: null,
      mood: null,
      blocker_reason: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
