'use client';

import Link from 'next/link';

import { BookActionsMenu } from '@/components/library/BookActionsMenu';
import { BookCategoryBadge } from '@/components/library/BookCategoryBadge';
import { BookPriorityBadge } from '@/components/library/BookPriorityBadge';
import { BookProgress } from '@/components/library/BookProgress';
import { BookStatusBadge } from '@/components/library/BookStatusBadge';
import type { Book } from '@/types/book';
import { ROUTES } from '@/utils/constants';
import { formatRelativeTime } from '@/utils/date';

interface BookCardProps {
  book: Book;
  layout?: 'grid' | 'list';
}

export function BookCard({ book, layout = 'grid' }: BookCardProps) {
  const lastRead = book.lastReadAt ? formatRelativeTime(book.lastReadAt) : 'Never';

  if (layout === 'list') {
    return (
      <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:flex-row sm:items-stretch">
        <CoverPlaceholder title={book.title} className="h-28 w-20 shrink-0 sm:h-auto sm:min-h-[7rem]" />
        <div className="min-w-0 flex-1 space-y-3">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-foreground">{book.title}</h3>
              {book.author ? <p className="truncate text-sm text-muted">{book.author}</p> : null}
            </div>
            <BookActionsMenu bookId={book.id} title={book.title} status={book.status} />
          </header>
          <div className="flex flex-wrap gap-2">
            <BookCategoryBadge category={book.category} />
            <BookPriorityBadge priority={book.priority} />
            <BookStatusBadge status={book.status} />
          </div>
          <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
          <MetaRow book={book} lastRead={lastRead} />
          <ActionRow bookId={book.id} />
        </div>
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <CoverPlaceholder title={book.title} className="h-36 w-full" />
        <BookActionsMenu bookId={book.id} title={book.title} status={book.status} />
      </div>
      <h3 className="line-clamp-2 text-base font-semibold text-foreground">{book.title}</h3>
      {book.author ? <p className="mt-1 line-clamp-1 text-sm text-muted">{book.author}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <BookCategoryBadge category={book.category} />
        <BookPriorityBadge priority={book.priority} />
        <BookStatusBadge status={book.status} />
      </div>
      <div className="mt-4">
        <BookProgress currentPage={book.currentPage} totalPages={book.totalPages} />
      </div>
      <MetaRow book={book} lastRead={lastRead} className="mt-3" />
      <div className="mt-auto pt-4">
        <ActionRow bookId={book.id} />
      </div>
    </article>
  );
}

function CoverPlaceholder({ title, className = '' }: { title: string; className?: string }) {
  const initial = title.trim().charAt(0).toUpperCase() || 'B';
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-gradient-to-br from-tint-muted to-border/40 text-2xl font-semibold text-tint ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function MetaRow({
  book,
  lastRead,
  className = '',
}: {
  book: Book;
  lastRead: string;
  className?: string;
}) {
  return (
    <dl className={`grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted ${className}`}>
      <div>
        <dt className="sr-only">Bookmarks</dt>
        <dd>{book.bookmarkCount} bookmarks</dd>
      </div>
      <div>
        <dt className="sr-only">Notes</dt>
        <dd>{book.noteCount} notes</dd>
      </div>
      <div className="col-span-2">
        <dt className="sr-only">Last read</dt>
        <dd>Last read {lastRead}</dd>
      </div>
    </dl>
  );
}

function ActionRow({ bookId }: { bookId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={ROUTES.reader(bookId)}
        className="inline-flex flex-1 items-center justify-center rounded-md bg-tint px-3 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Continue reading
      </Link>
      <Link
        href={ROUTES.book(bookId)}
        className="inline-flex flex-1 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-tint-muted"
      >
        Open details
      </Link>
    </div>
  );
}
