import type { Book } from '@/types/book';
import type { LibrarySortOption } from '@/types/book';
import type { LibraryCategoryFilter, LibraryPriorityFilter, LibraryStatusFilter } from '@/types/book';
import { progressPercent } from '@/types/book';

export function filterBooks(
  books: Book[],
  options: {
    query: string;
    status: LibraryStatusFilter;
    category: LibraryCategoryFilter;
    priority: LibraryPriorityFilter;
  },
): Book[] {
  const q = options.query.trim().toLowerCase();

  return books.filter((book) => {
    if (options.status !== 'all' && book.status !== options.status) {
      return false;
    }
    if (options.category !== 'all' && book.category !== options.category) {
      return false;
    }
    if (options.priority !== 'all' && book.priority !== options.priority) {
      return false;
    }
    if (!q) {
      return true;
    }
    const title = book.title.toLowerCase();
    const file = (book.pdfFileName ?? '').toLowerCase();
    const author = (book.author ?? '').toLowerCase();
    return title.includes(q) || file.includes(q) || author.includes(q);
  });
}

export function sortBooks(books: Book[], sort: LibrarySortOption): Book[] {
  const next = [...books];
  next.sort((a, b) => {
    switch (sort) {
      case 'recently_read': {
        const aTime = Date.parse(a.lastReadAt ?? a.updatedAt);
        const bTime = Date.parse(b.lastReadAt ?? b.updatedAt);
        return bTime - aTime;
      }
      case 'recently_added':
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      case 'title_az':
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      case 'progress':
        return progressPercent(b.currentPage, b.totalPages) - progressPercent(a.currentPage, a.totalPages);
      case 'pages':
        return b.totalPages - a.totalPages;
      default:
        return 0;
    }
  });
  return next;
}
