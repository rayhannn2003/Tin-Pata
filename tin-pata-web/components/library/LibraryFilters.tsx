'use client';

import type { ReactNode } from 'react';

import {
  BOOK_CATEGORIES,
  BOOK_PRIORITIES,
  BOOK_STATUSES,
  formatCategoryLabel,
  formatPriorityLabel,
  formatStatusLabel,
  type LibraryCategoryFilter,
  type LibraryPriorityFilter,
  type LibraryStatusFilter,
} from '@/types/book';

interface LibraryFiltersProps {
  status: LibraryStatusFilter;
  category: LibraryCategoryFilter;
  priority: LibraryPriorityFilter;
  onStatusChange: (value: LibraryStatusFilter) => void;
  onCategoryChange: (value: LibraryCategoryFilter) => void;
  onPriorityChange: (value: LibraryPriorityFilter) => void;
}

export function LibraryFilters({
  status,
  category,
  priority,
  onStatusChange,
  onCategoryChange,
  onPriorityChange,
}: LibraryFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-muted">Status</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          <FilterChip
            active={status === 'all'}
            onClick={() => onStatusChange('all')}
            label="All statuses"
          >
            All
          </FilterChip>
          {BOOK_STATUSES.map((value) => (
            <FilterChip
              key={value}
              active={status === value}
              onClick={() => onStatusChange(value)}
              label={formatStatusLabel(value)}
            >
              {formatStatusLabel(value)}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="library-category" className="mb-1.5 block text-xs font-medium text-muted">
            Category
          </label>
          <select
            id="library-category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as LibraryCategoryFilter)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All categories</option>
            {BOOK_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {formatCategoryLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="library-priority" className="mb-1.5 block text-xs font-medium text-muted">
            Priority
          </label>
          <select
            id="library-priority"
            value={priority}
            onChange={(event) => onPriorityChange(event.target.value as LibraryPriorityFilter)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="all">All priorities</option>
            {BOOK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {formatPriorityLabel(value)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
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
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-tint text-white'
          : 'border border-border bg-background text-muted hover:bg-tint-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
