export const BOOK_STATUSES = ['not_started', 'reading', 'paused', 'finished'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const BOOK_CATEGORIES = [
  'general',
  'academic',
  'self_improvement',
  'research',
  'fiction',
  'islamic',
  'technical',
  'business',
  'cs',
  'other',
] as const;
export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export const BOOK_PRIORITIES = ['low', 'normal', 'high'] as const;
export type BookPriority = (typeof BOOK_PRIORITIES)[number];

export const LIBRARY_SORT_OPTIONS = [
  'recently_read',
  'recently_added',
  'title_az',
  'progress',
  'pages',
] as const;
export type LibrarySortOption = (typeof LIBRARY_SORT_OPTIONS)[number];

export type LibraryViewMode = 'grid' | 'list';
export type LibraryStatusFilter = 'all' | BookStatus;
export type LibraryCategoryFilter = 'all' | BookCategory;
export type LibraryPriorityFilter = 'all' | BookPriority;

/** Book row as used by the web library (Supabase `books` + counts). */
export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  status: BookStatus;
  category: BookCategory;
  priority: BookPriority;
  totalPages: number;
  currentPage: number;
  currentPageUpdatedAt: string | null;
  pdfFileName: string | null;
  pdfFileSize: number | null;
  cloudStoragePath: string | null;
  pdfCloudAvailable: boolean;
  /** Supabase Storage path in `user-covers`, e.g. `{userId}/books/{bookId}/cover.jpg` */
  coverImagePath: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  /** Derived: current_page_updated_at or updated_at */
  lastReadAt: string | null;
  bookmarkCount: number;
  noteCount: number;
}

export interface BookReadingStats {
  totalSessions: number;
  totalMinutes: number;
  totalPagesRead: number;
  averagePagesPerSession: number;
  averageMinutesPerSession: number;
  longestSessionMinutes: number;
  firstReadAt: string | null;
  lastReadAt: string | null;
}

export function isBookStatus(value: string | null | undefined): value is BookStatus {
  return BOOK_STATUSES.includes(value as BookStatus);
}

export function parseBookStatus(value: string | null | undefined): BookStatus {
  return isBookStatus(value) ? value : 'not_started';
}

export function isBookCategory(value: string | null | undefined): value is BookCategory {
  return BOOK_CATEGORIES.includes(value as BookCategory);
}

export function parseBookCategory(value: string | null | undefined): BookCategory {
  return isBookCategory(value) ? value : 'general';
}

export function isBookPriority(value: string | null | undefined): value is BookPriority {
  return BOOK_PRIORITIES.includes(value as BookPriority);
}

export function parseBookPriority(value: string | null | undefined): BookPriority {
  return isBookPriority(value) ? value : 'normal';
}

export function progressPercent(currentPage: number, totalPages: number): number {
  if (totalPages <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));
}

export function formatCategoryLabel(category: BookCategory): string {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatStatusLabel(status: BookStatus): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'reading':
      return 'Reading';
    case 'paused':
      return 'Paused';
    case 'finished':
      return 'Finished';
    default:
      return status;
  }
}

export function formatPriorityLabel(priority: BookPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
