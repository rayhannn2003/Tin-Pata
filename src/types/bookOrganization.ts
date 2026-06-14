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
  'progress_desc',
  'priority',
] as const;

export type LibrarySortOption = (typeof LIBRARY_SORT_OPTIONS)[number];

export const DEFAULT_BOOK_CATEGORY: BookCategory = 'general';
export const DEFAULT_BOOK_PRIORITY: BookPriority = 'normal';
export const DEFAULT_LIBRARY_SORT: LibrarySortOption = 'recently_read';

export type LibraryCategoryFilter = 'all' | BookCategory;
export type LibraryPriorityFilter = 'all' | BookPriority;
export type LibraryStatusFilter = 'all' | 'reading' | 'paused' | 'finished';

export function isBookCategory(value: string | null | undefined): value is BookCategory {
  return BOOK_CATEGORIES.includes(value as BookCategory);
}

export function isBookPriority(value: string | null | undefined): value is BookPriority {
  return BOOK_PRIORITIES.includes(value as BookPriority);
}

export function parseBookCategory(value: string | null | undefined): BookCategory {
  return isBookCategory(value) ? value : DEFAULT_BOOK_CATEGORY;
}

export function parseBookPriority(value: string | null | undefined): BookPriority {
  return isBookPriority(value) ? value : DEFAULT_BOOK_PRIORITY;
}

export function isLibrarySortOption(value: string | null | undefined): value is LibrarySortOption {
  return LIBRARY_SORT_OPTIONS.includes(value as LibrarySortOption);
}

export function parseLibrarySortOption(value: string | null | undefined): LibrarySortOption {
  return isLibrarySortOption(value) ? value : DEFAULT_LIBRARY_SORT;
}

export function categoryTranslationKey(category: BookCategory): string {
  return `library.category.${category}`;
}

export function priorityTranslationKey(priority: BookPriority): string {
  return `library.priority.${priority}`;
}

export function sortTranslationKey(sort: LibrarySortOption): string {
  return `library.sort.${sort}`;
}
