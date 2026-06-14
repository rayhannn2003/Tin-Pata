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
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/ids';
import { titleFromFileName } from '@/utils/format';

export class BookImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookImportError';
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
};
