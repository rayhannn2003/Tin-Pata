import { BookmarkRepository } from '@/db/repositories/BookmarkRepository';
import type { Bookmark, BookmarkWithBook } from '@/types';
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/ids';

export class BookmarkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookmarkError';
  }
}

export const BookmarkService = {
  async getBookBookmarks(bookId: string): Promise<Bookmark[]> {
    return BookmarkRepository.getBookmarksByBookId(bookId);
  },

  async getAllBookmarksWithBook(): Promise<BookmarkWithBook[]> {
    return BookmarkRepository.getAllBookmarksWithBook();
  },

  async searchBookmarks(query: string): Promise<BookmarkWithBook[]> {
    return BookmarkRepository.searchBookmarks(query);
  },

  async isPageBookmarked(bookId: string, pageNumber: number): Promise<boolean> {
    return BookmarkRepository.isPageBookmarked(bookId, pageNumber);
  },

  async deleteBookmark(id: string): Promise<void> {
    await BookmarkRepository.deleteBookmark(id);
  },

  async toggleBookmark(
    bookId: string,
    pageNumber: number,
    title?: string | null,
  ): Promise<{ bookmarked: boolean; bookmark: Bookmark | null }> {
    const page = Math.max(1, Math.floor(pageNumber));
    const existing = await BookmarkRepository.getBookmarkByPage(bookId, page);

    if (existing) {
      await BookmarkRepository.deleteBookmark(existing.id);
      return { bookmarked: false, bookmark: null };
    }

    const bookmark: Bookmark = {
      id: await generateId(),
      bookId,
      pageNumber: page,
      title: title?.trim() || `Page ${page}`,
      createdAt: nowIso(),
    };

    try {
      await BookmarkRepository.createBookmark(bookmark);
      return { bookmarked: true, bookmark };
    } catch {
      throw new BookmarkError('Could not save bookmark. This page may already be bookmarked.');
    }
  },

  formatDefaultTitle(pageNumber: number): string {
    return `Page ${pageNumber}`;
  },
};
