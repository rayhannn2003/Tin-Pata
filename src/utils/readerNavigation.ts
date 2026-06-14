import { Alert } from 'react-native';
import type { Router } from 'expo-router';

import { BookService } from '@/services/BookService';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * Opens the reader using safe auto-resume: updates stored currentPage first,
 * then navigates. No post-load setPage — fallback banner appears if resume fails.
 * Returns false when the PDF file is missing.
 */
export async function openReaderAtPage(
  router: Router,
  bookId: string,
  pageNumber: number,
  t?: TranslateFn,
): Promise<boolean> {
  const book = await BookService.getBookById(bookId);
  if (!book || !PdfAvailabilityService.isPdfAvailable(book)) {
    if (t) {
      Alert.alert(t('pdfMissing.blockedTitle'), t('pdfMissing.blockedMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('pdfMissing.relink'),
          onPress: () => router.push({ pathname: '/book/[bookId]', params: { bookId } }),
        },
      ]);
    }
    return false;
  }

  const page = Math.max(1, Math.floor(pageNumber));
  await BookService.updateProgress(bookId, { currentPage: page });
  router.push(`/reader/${bookId}`);
  return true;
}

export async function openReaderForBook(
  router: Router,
  bookId: string,
  t?: TranslateFn,
): Promise<boolean> {
  const book = await BookService.getBookById(bookId);
  if (!book) {
    return false;
  }
  return openReaderAtPage(router, bookId, book.currentPage > 0 ? book.currentPage : 1, t);
}

export function truncatePreview(text: string, maxLength = 140): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}
