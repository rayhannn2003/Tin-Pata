import { withDatabase } from '@/db/database';
import type { Bookmark, BookmarkWithBook } from '@/types';

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

interface BookmarkWithBookRow extends BookmarkRow {
  book_title: string;
}

function mapRowWithBook(row: BookmarkWithBookRow): BookmarkWithBook {
  return {
    ...mapRow(row),
    bookTitle: row.book_title,
  };
}

const BOOKMARKS_WITH_BOOK_SELECT = `
  SELECT bm.*, b.title AS book_title
  FROM bookmarks bm
  INNER JOIN books b ON b.id = bm.book_id
`;

export const BookmarkRepository = {
  async getBookmarksByBookId(bookId: string): Promise<Bookmark[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<BookmarkRow>(
        'SELECT * FROM bookmarks WHERE book_id = ? ORDER BY page_number ASC',
        bookId,
      );
      return rows.map(mapRow);
    });
  },

  async getBookmarkByPage(bookId: string, pageNumber: number): Promise<Bookmark | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<BookmarkRow>(
        'SELECT * FROM bookmarks WHERE book_id = ? AND page_number = ?',
        bookId,
        pageNumber,
      );
      return row ? mapRow(row) : null;
    });
  },

  async createBookmark(bookmark: Bookmark): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync(
        'INSERT INTO bookmarks (id, book_id, page_number, title, created_at) VALUES (?, ?, ?, ?, ?)',
        bookmark.id,
        bookmark.bookId,
        bookmark.pageNumber,
        bookmark.title,
        bookmark.createdAt,
      );
    });
  },

  async deleteBookmark(id: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM bookmarks WHERE id = ?', id);
    });
  },

  async deleteBookmarksByBookId(bookId: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM bookmarks WHERE book_id = ?', bookId);
    });
  },

  async isPageBookmarked(bookId: string, pageNumber: number): Promise<boolean> {
    const bookmark = await this.getBookmarkByPage(bookId, pageNumber);
    return bookmark !== null;
  },

  async countByBookId(bookId: string): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM bookmarks WHERE book_id = ?',
        bookId,
      );
      return row?.count ?? 0;
    });
  },

  async getAllBookmarksWithBook(): Promise<BookmarkWithBook[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<BookmarkWithBookRow>(
        `${BOOKMARKS_WITH_BOOK_SELECT} ORDER BY bm.created_at DESC`,
      );
      return rows.map(mapRowWithBook);
    });
  },

  async searchBookmarks(query: string): Promise<BookmarkWithBook[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getAllBookmarksWithBook();
    }

    const pattern = `%${trimmed.replace(/[%_]/g, '')}%`;
    const pageNumber = Number.parseInt(trimmed, 10);
    const hasPageMatch = Number.isFinite(pageNumber) && pageNumber > 0;

    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<BookmarkWithBookRow>(
        `${BOOKMARKS_WITH_BOOK_SELECT}
         WHERE LOWER(COALESCE(bm.title, '')) LIKE LOWER(?)
            OR LOWER(b.title) LIKE LOWER(?)
            ${hasPageMatch ? 'OR bm.page_number = ?' : ''}
         ORDER BY bm.created_at DESC`,
        ...(hasPageMatch
          ? [pattern, pattern, pageNumber]
          : [pattern, pattern]),
      );
      return rows.map(mapRowWithBook);
    });
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
