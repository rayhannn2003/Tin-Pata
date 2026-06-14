import { fileExists, fileExistsForBook } from '@/storage/pdfStorage';
import type { Book } from '@/types';

/** Derived at runtime — not stored in the database. */
export function isPdfAvailable(book: Pick<Book, 'id' | 'localUri'>): boolean {
  if (!book.localUri?.trim()) {
    return false;
  }
  if (fileExistsForBook(book.id)) {
    return true;
  }
  return fileExists(book.localUri);
}

export function countMissingPdfs(books: Array<Pick<Book, 'id' | 'localUri'>>): number {
  return books.filter((book) => !isPdfAvailable(book)).length;
}

export const PdfAvailabilityService = {
  isPdfAvailable,
  countMissingPdfs,
};
