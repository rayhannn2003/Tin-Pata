'use client';

import type { ReactNode } from 'react';

import type { LibrarySortOption, LibraryViewMode } from '@/types/book';

interface LibraryToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  sort: LibrarySortOption;
  onSortChange: (value: LibrarySortOption) => void;
  viewMode: LibraryViewMode;
  onViewModeChange: (value: LibraryViewMode) => void;
  resultCount: number;
  onUpload?: () => void;
}

const SORT_OPTIONS: { value: LibrarySortOption; label: string }[] = [
  { value: 'recently_read', label: 'Recently read' },
  { value: 'recently_added', label: 'Recently added' },
  { value: 'title_az', label: 'Title A–Z' },
  { value: 'progress', label: 'Progress' },
  { value: 'pages', label: 'Pages' },
];

export function LibraryToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  resultCount,
  onUpload,
}: LibraryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 flex-1">
        <label htmlFor="library-search" className="mb-1.5 block text-xs font-medium text-muted">
          Search
        </label>
        <input
          id="library-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by title or filename…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline-none"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {onUpload ? (
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex h-[38px] items-center rounded-md bg-tint px-3 text-sm font-medium text-white hover:opacity-90"
          >
            Upload PDF
          </button>
        ) : null}

        <div>
          <label htmlFor="library-sort" className="mb-1.5 block text-xs font-medium text-muted">
            Sort
          </label>
          <select
            id="library-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as LibrarySortOption)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div role="group" aria-label="View mode" className="flex rounded-md border border-border p-0.5">
          <ViewToggle
            active={viewMode === 'grid'}
            onClick={() => onViewModeChange('grid')}
            label="Grid view"
          >
            Grid
          </ViewToggle>
          <ViewToggle
            active={viewMode === 'list'}
            onClick={() => onViewModeChange('list')}
            label="List view"
          >
            List
          </ViewToggle>
        </div>

        <p className="pb-2 text-xs text-muted" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'book' : 'books'}
        </p>
      </div>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-tint text-white' : 'text-muted hover:bg-tint-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
