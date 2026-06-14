import { fileExists, fileExistsForBook, getLocalPdfUri } from '@/storage/pdfStorage';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import type { Book } from '@/types';

export const PAGE_SAVE_DEBOUNCE_MS = 450;
export const PDF_LOAD_TIMEOUT_MS = 20_000;

export class PdfReaderError extends Error {
  readonly code: 'pdf_missing' | 'generic';

  constructor(message: string, code: 'pdf_missing' | 'generic' = 'generic') {
    super(message);
    this.name = 'PdfReaderError';
    this.code = code;
  }
}

export type PageValidationResult =
  | { ok: true; page: number }
  | { ok: false; message: string };

export const PdfReaderService = {
  clampPage(page: number, totalPages: number): number {
    const normalized = Math.max(1, Math.floor(page));
    if (totalPages > 0) {
      return Math.min(normalized, totalPages);
    }
    return normalized;
  },

  validatePageInput(input: string, totalPages: number): PageValidationResult {
    const trimmed = input.trim();
    if (!trimmed) {
      return { ok: false, message: 'Enter a page number.' };
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
      return { ok: false, message: 'Page must be a positive whole number.' };
    }

    if (totalPages > 0 && parsed > totalPages) {
      return { ok: false, message: `Page must be between 1 and ${totalPages}.` };
    }

    return { ok: true, page: parsed };
  },

  formatPdfSourceUri(localUri: string): string {
    const trimmed = localUri.trim();
    if (trimmed.startsWith('content://')) {
      return trimmed;
    }

    const withoutScheme = trimmed.replace(/^file:\/\//i, '');
    const absolutePath = decodeURIComponent(withoutScheme);

    if (absolutePath.startsWith('/')) {
      // react-native-pdf expects file:///absolute/path on Android
      return `file://${absolutePath}`;
    }

    return trimmed;
  },

  resolveReaderUri(book: Book): string {
    const canonicalUri = getLocalPdfUri(book.id);
    if (fileExistsForBook(book.id)) {
      return this.formatPdfSourceUri(canonicalUri);
    }
    return this.formatPdfSourceUri(book.localUri);
  },

  computeProgressRatio(currentPage: number, totalPages: number): number {
    if (totalPages <= 0) {
      return 0;
    }
    return Math.min(Math.max(currentPage / totalPages, 0), 1);
  },

  verifyBookForReading(book: Book | null, bookId: string | undefined): Book {
    if (!bookId) {
      throw new PdfReaderError('No book was selected.');
    }
    if (!book) {
      throw new PdfReaderError('Book not found.');
    }
    if (!PdfAvailabilityService.isPdfAvailable(book)) {
      throw new PdfReaderError('PDF file is missing.', 'pdf_missing');
    }
    return book;
  },

  initialPageForBook(book: Book): number {
    return book.currentPage > 0 ? book.currentPage : 1;
  },

  shouldShowResumeHint(book: Book): boolean {
    return book.currentPage > 1;
  },

  formatPdfLoadError(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }
    return 'Could not open this PDF. The file may be corrupted or unsupported.';
  },
};
