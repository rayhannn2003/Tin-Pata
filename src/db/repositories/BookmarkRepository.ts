import { getDatabase } from '@/db/database';
import type { Bookmark } from '@/types';

interface BookmarkRow {
  id: string;
  book_id: string;
  page_number: number;
  title: string | null;
  created_at: string;
}

function mapRow(row: BookmarkRow): Bookmark {
  return {
    id: row.id,
    bookId: row.book_id,
    pageNumber: row.page_number,
    title: row.title,
    createdAt: row.created_at,
  };
}

export const BookmarkRepository = {
  async getBookmarksByBookId(bookId: string): Promise<Bookmark[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<BookmarkRow>(
      'SELECT * FROM bookmarks WHERE book_id = ? ORDER BY page_number ASC',
      bookId,
    );
    return rows.map(mapRow);
  },

  async getBookmarkByPage(bookId: string, pageNumber: number): Promise<Bookmark | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<BookmarkRow>(
      'SELECT * FROM bookmarks WHERE book_id = ? AND page_number = ?',
      bookId,
      pageNumber,
    );
    return row ? mapRow(row) : null;
  },

  async createBookmark(bookmark: Bookmark): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO bookmarks (id, book_id, page_number, title, created_at) VALUES (?, ?, ?, ?, ?)',
      bookmark.id,
      bookmark.bookId,
      bookmark.pageNumber,
      bookmark.title,
      bookmark.createdAt,
    );
  },

  async deleteBookmark(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', id);
  },

  async deleteBookmarksByBookId(bookId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM bookmarks WHERE book_id = ?', bookId);
  },

  async isPageBookmarked(bookId: string, pageNumber: number): Promise<boolean> {
    const bookmark = await this.getBookmarkByPage(bookId, pageNumber);
    return bookmark !== null;
  },

  async countByBookId(bookId: string): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks WHERE book_id = ?',
      bookId,
    );
    return row?.count ?? 0;
  },

  /** @deprecated Use getBookmarksByBookId */
  async findByBookId(bookId: string): Promise<Bookmark[]> {
    return this.getBookmarksByBookId(bookId);
  },

  /** @deprecated Use createBookmark */
  async insert(bookmark: Bookmark): Promise<void> {
    return this.createBookmark(bookmark);
  },

  /** @deprecated Use deleteBookmark */
  async delete(id: string): Promise<void> {
    return this.deleteBookmark(id);
  },
};
