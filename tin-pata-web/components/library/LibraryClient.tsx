'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { BookEmptyState } from '@/components/library/BookEmptyState';
import { BookGrid } from '@/components/library/BookGrid';
import { BookList } from '@/components/library/BookList';
import { LibraryFilters } from '@/components/library/LibraryFilters';
import { LibraryToolbar } from '@/components/library/LibraryToolbar';
import { UploadBookDialog } from '@/components/library/UploadBookDialog';
import type { Book } from '@/types/book';
import type {
  LibraryCategoryFilter,
  LibraryPriorityFilter,
  LibrarySortOption,
  LibraryStatusFilter,
  LibraryViewMode,
} from '@/types/book';
import { filterBooks, sortBooks } from '@/utils/library';
import { storage } from '@/utils/storage';
import { useDeferredValue, useMemo, useSyncExternalStore } from 'react';

const VIEW_MODE_KEY = 'tin-pata.library.viewMode';
const VIEW_MODE_EVENT = 'tin-pata-library-view-mode';

function readViewMode(): LibraryViewMode {
  const saved = storage.get(VIEW_MODE_KEY);
  return saved === 'list' ? 'list' : 'grid';
}

function subscribeViewMode(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const handler = () => onStoreChange();
  window.addEventListener('storage', handler);
  window.addEventListener(VIEW_MODE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(VIEW_MODE_EVENT, handler);
  };
}

interface LibraryClientProps {
  books: Book[];
}

export function LibraryClient({ books }: LibraryClientProps) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [status, setStatus] = useState<LibraryStatusFilter>('all');
  const [category, setCategory] = useState<LibraryCategoryFilter>('all');
  const [priority, setPriority] = useState<LibraryPriorityFilter>('all');
  const [sort, setSort] = useState<LibrarySortOption>('recently_read');
  const viewMode = useSyncExternalStore(subscribeViewMode, readViewMode, () => 'grid' as const);

  function handleViewModeChange(next: LibraryViewMode) {
    storage.set(VIEW_MODE_KEY, next);
    window.dispatchEvent(new Event(VIEW_MODE_EVENT));
  }

  const visible = useMemo(() => {
    const filtered = filterBooks(books, {
      query: deferredQuery,
      status,
      category,
      priority,
    });
    return sortBooks(filtered, sort);
  }, [books, deferredQuery, status, category, priority, sort]);

  const uploadDialog = (
    <UploadBookDialog
      open={uploadOpen}
      onClose={() => setUploadOpen(false)}
      onUploaded={() => router.refresh()}
    />
  );

  if (books.length === 0) {
    return (
      <>
        <BookEmptyState onUpload={() => setUploadOpen(true)} />
        {uploadDialog}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <LibraryToolbar
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        resultCount={visible.length}
        onUpload={() => setUploadOpen(true)}
      />
      <LibraryFilters
        status={status}
        category={category}
        priority={priority}
        onStatusChange={setStatus}
        onCategoryChange={setCategory}
        onPriorityChange={setPriority}
      />

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No books match these filters</p>
          <p className="mt-1 text-sm text-muted">Try clearing search or choosing All statuses.</p>
        </div>
      ) : viewMode === 'list' ? (
        <BookList books={visible} />
      ) : (
        <BookGrid books={visible} />
      )}

      <section
        aria-label="Coming soon"
        className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-5 text-sm text-muted"
      >
        <p className="font-medium text-foreground">Extension points</p>
        <p className="mt-1">
          Cloud sync status · Reading heatmap · Collections · Tags · AI summaries — placeholders
          only for later phases.
        </p>
      </section>

      {uploadDialog}
    </div>
  );
}
