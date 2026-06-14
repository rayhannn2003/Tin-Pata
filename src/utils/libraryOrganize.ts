import {
  DEFAULT_LIBRARY_SORT,
  type BookCategory,
  type BookPriority,
  type LibraryCategoryFilter,
  type LibraryPriorityFilter,
  type LibrarySortOption,
  type LibraryStatusFilter,
} from '@/types/bookOrganization';
import type { Book, BookStatus } from '@/types';
import { PdfReaderService } from '@/services/PdfReaderService';

export interface LibraryOrganizeFilters {
  status: LibraryStatusFilter;
  category: LibraryCategoryFilter;
  priority: LibraryPriorityFilter;
  search: string;
}

export function filterLibraryBooks<T extends Book>(
  books: T[],
  filters: LibraryOrganizeFilters,
): T[] {
  const query = filters.search.trim().toLowerCase();

  return books.filter((book) => {
    if (filters.status !== 'all' && book.status !== filters.status) {
      return false;
    }
    if (filters.category !== 'all' && book.category !== filters.category) {
      return false;
    }
    if (filters.priority !== 'all' && book.priority !== filters.priority) {
      return false;
    }
    if (query) {
      const haystack = `${book.title} ${book.fileName}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

const PRIORITY_RANK: Record<BookPriority, number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export function sortLibraryBooks<T extends Book>(books: T[], sort: LibrarySortOption): T[] {
  const sorted = [...books];

  switch (sort) {
    case 'recently_added':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'title_az':
      sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
      break;
    case 'progress_desc':
      sorted.sort((a, b) => {
        const progressB = PdfReaderService.computeProgressRatio(b.currentPage, b.totalPages);
        const progressA = PdfReaderService.computeProgressRatio(a.currentPage, a.totalPages);
        if (progressB !== progressA) {
          return progressB - progressA;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
      break;
    case 'priority':
      sorted.sort((a, b) => {
        const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return b.updatedAt.localeCompare(a.updatedAt);
      });
      break;
    case 'recently_read':
    default:
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
  }

  return sorted;
}

export function organizeLibraryBooks<T extends Book>(
  books: T[],
  filters: LibraryOrganizeFilters,
  sort: LibrarySortOption = DEFAULT_LIBRARY_SORT,
): T[] {
  return sortLibraryBooks(filterLibraryBooks(books, filters), sort);
}

export function hasActiveLibraryFilters(filters: LibraryOrganizeFilters): boolean {
  return (
    filters.status !== 'all' ||
    filters.category !== 'all' ||
    filters.priority !== 'all' ||
    filters.search.trim().length > 0
  );
}

export function statusTranslationKey(status: BookStatus): string {
  switch (status) {
    case 'reading':
      return 'library.filterReading';
    case 'paused':
      return 'library.filterPaused';
    case 'finished':
      return 'library.filterFinished';
    default:
      return 'bookDetail.statusNotStarted';
  }
}

export function categoryLabelKey(category: BookCategory): string {
  return `library.category.${category}`;
}

export { sortTranslationKey } from '@/types/bookOrganization';
