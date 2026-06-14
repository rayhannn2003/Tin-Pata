import type { Router } from 'expo-router';

import { BookService } from '@/services/BookService';

/**
 * Opens the reader using safe auto-resume: updates stored currentPage first,
 * then navigates. No post-load setPage — fallback banner appears if resume fails.
 */
export async function openReaderAtPage(
  router: Router,
  bookId: string,
  pageNumber: number,
): Promise<void> {
  const page = Math.max(1, Math.floor(pageNumber));
  await BookService.updateProgress(bookId, { currentPage: page });
  router.push(`/reader/${bookId}`);
}

export function truncatePreview(text: string, maxLength = 140): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}
