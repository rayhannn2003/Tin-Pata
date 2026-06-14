import { BookRepository } from '@/db/repositories/BookRepository';
import { BookmarkRepository } from '@/db/repositories/BookmarkRepository';
import { NoteRepository } from '@/db/repositories/NoteRepository';
import {
  copyPdfToAppStorage,
  deleteLocalPdf,
  importPdfFromPicker,
  pickPdf,
} from '@/storage/pdfStorage';
import type { Book, BookAnnotationCounts, BookStatus } from '@/types';
import {
  DEFAULT_BOOK_CATEGORY,
  DEFAULT_BOOK_PRIORITY,
  type BookCategory,
  type BookPriority,
} from '@/types/bookOrganization';
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/ids';
import { titleFromFileName } from '@/utils/format';

export interface BookRelinkResult {
  book: Book;
  pageAdjusted: boolean;
  previousPage: number;
  adjustedPage: number;
}

export class BookImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookImportError';
  }
}

export class BookRelinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookRelinkError';
  }
}

export const BookService = {
  async importPdfBook(): Promise<Book | null> {
    const picked = await pickPdf();
    if (!picked) {
      return null;
    }

    const bookId = await generateId();

    try {
      const { localUri, fileSize } = await importPdfFromPicker(bookId, picked);
      const now = nowIso();

      const book: Book = {
        id: bookId,
        title: titleFromFileName(picked.name),
        author: null,
        localUri,
        fileName: picked.name,
        fileSize: picked.size ?? fileSize,
        cloudinaryPublicId: null,
        cloudinaryAssetId: null,
        totalPages: 0,
        currentPage: 1,
        status: 'reading',
        category: DEFAULT_BOOK_CATEGORY,
        priority: DEFAULT_BOOK_PRIORITY,
        isUploaded: false,
        isDownloaded: true,
        createdAt: now,
        updatedAt: now,
      };

      await BookRepository.createBook(book);
      return book;
    } catch (error) {
      try {
        await deleteLocalPdf(bookId);
      } catch {
        // Ignore cleanup errors.
      }

      if (error instanceof Error) {
        throw new BookImportError(error.message);
      }
      throw new BookImportError('Could not import the PDF.');
    }
  },

  async getLibraryBooks(): Promise<Book[]> {
    return BookRepository.getAllBooks();
  },

  async getContinueReadingBook(): Promise<Book | null> {
    return BookRepository.getContinueReadingBook();
  },

  async getBookAnnotationCounts(bookId: string): Promise<BookAnnotationCounts> {
    const [bookmarkCount, noteCount] = await Promise.all([
      BookmarkRepository.countByBookId(bookId),
      NoteRepository.countByBookId(bookId),
    ]);
    return { bookmarkCount, noteCount };
  },

  async getLibraryBooksWithCounts(): Promise<Array<Book & BookAnnotationCounts>> {
    const books = await BookRepository.getAllBooks();
    return Promise.all(
      books.map(async (book) => {
        const counts = await this.getBookAnnotationCounts(book.id);
        return { ...book, ...counts };
      }),
    );
  },

  async getBookById(id: string): Promise<Book | null> {
    return BookRepository.getBookById(id);
  },

  async deleteBook(id: string): Promise<void> {
    const book = await BookRepository.getBookById(id);
    if (!book) {
      return;
    }

    await deleteLocalPdf(id);
    await BookRepository.deleteBook(id);
  },

  async renameBook(id: string, title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('Title cannot be empty.');
    }
    await BookRepository.updateBook(id, { title: trimmed });
  },

  async updateBookStatus(id: string, status: BookStatus): Promise<void> {
    await BookRepository.updateStatus(id, status);
  },

  async updateBookCategory(id: string, category: BookCategory): Promise<void> {
    await BookRepository.updateCategory(id, category);
  },

  async updateBookPriority(id: string, priority: BookPriority): Promise<void> {
    await BookRepository.updatePriority(id, priority);
  },

  async updateProgress(
    id: string,
    progress: { currentPage?: number; totalPages?: number },
  ): Promise<void> {
    const book = await BookRepository.getBookById(id);
    if (!book) {
      throw new Error('Book not found.');
    }

    const fields: Partial<Book> = {};

    if (progress.currentPage !== undefined) {
      fields.currentPage = Math.max(1, Math.floor(progress.currentPage));
      if (book.status === 'not_started') {
        fields.status = 'reading';
      }
    }

    if (
      progress.totalPages !== undefined &&
      progress.totalPages > 0 &&
      book.totalPages <= 0
    ) {
      fields.totalPages = Math.floor(progress.totalPages);
    }

    if (Object.keys(fields).length === 0) {
      return;
    }

    await BookRepository.updateBook(id, fields);
  },

  /** Re-copy helper if needed later; not used in normal import flow. */
  async copyPdfToStorage(sourceUri: string, bookId: string) {
    return copyPdfToAppStorage(sourceUri, bookId);
  },

  async relinkPdf(bookId: string): Promise<BookRelinkResult | null> {
    const book = await BookRepository.getBookById(bookId);
    if (!book) {
      throw new BookRelinkError('Book not found.');
    }

    const picked = await pickPdf();
    if (!picked) {
      return null;
    }

    try {
      const { localUri, fileSize } = await copyPdfToAppStorage(picked.uri, bookId);
      const previousPage = book.currentPage;
      let adjustedPage = previousPage;
      let pageAdjusted = false;

      if (book.totalPages > 0 && previousPage > book.totalPages) {
        adjustedPage = book.totalPages;
        pageAdjusted = true;
      }

      await BookRepository.updateBook(bookId, {
        localUri,
        fileName: picked.name,
        fileSize: picked.size ?? fileSize,
        isDownloaded: true,
        ...(pageAdjusted ? { currentPage: adjustedPage } : {}),
      });

      const updated = await BookRepository.getBookById(bookId);
      if (!updated) {
        throw new BookRelinkError('Could not relink PDF.');
      }

      return {
        book: updated,
        pageAdjusted,
        previousPage,
        adjustedPage,
      };
    } catch (error) {
      if (error instanceof BookRelinkError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BookRelinkError(error.message);
      }
      throw new BookRelinkError('Could not relink PDF.');
    }
  },

  async clampProgressAfterPdfLoad(bookId: string, pageCount: number): Promise<boolean> {
    if (pageCount <= 0) {
      return false;
    }

    const book = await BookRepository.getBookById(bookId);
    if (!book) {
      return false;
    }

    const fields: Partial<Book> = {};
    let adjusted = false;

    if (book.currentPage > pageCount) {
      fields.currentPage = pageCount;
      adjusted = true;
    }

    if (book.totalPages !== pageCount) {
      fields.totalPages = pageCount;
    }

    if (Object.keys(fields).length === 0) {
      return false;
    }

    await BookRepository.updateBook(bookId, fields);
    return adjusted;
  },
};
