import Link from 'next/link';

import { BookActionsMenu } from '@/components/library/BookActionsMenu';
import { BookCategoryBadge } from '@/components/library/BookCategoryBadge';
import { BookPriorityBadge } from '@/components/library/BookPriorityBadge';
import { BookProgress } from '@/components/library/BookProgress';
import { BookStatusBadge } from '@/components/library/BookStatusBadge';
import type { Book } from '@/types/book';
import { progressPercent } from '@/types/book';
import { ROUTES } from '@/utils/constants';

interface BookHeroProps {
  book: Book;
}

export function BookHero({ book }: BookHeroProps) {
  const percent = progressPercent(book.currentPage, book.totalPages);

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Link
              href={ROUTES.library}
              className="text-xs font-medium text-tint hover:underline"
            >
              ← Library
            </Link>
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {book.title}
            </h1>
            <BookActionsMenu
              bookId={book.id}
              title={book.title}
              status={book.status}
              redirectToLibraryOnDelete
            />
          </div>
          {book.author ? <p className="mt-2 text-base text-muted">{book.author}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <BookStatusBadge status={book.status} />
            <BookCategoryBadge category={book.category} />
            <BookPriorityBadge priority={book.priority} />
          </div>
          <div className="mt-5 max-w-md">
            <p className="mb-2 text-sm text-muted">{percent}% complete</p>
            <BookProgress
              currentPage={book.currentPage}
              totalPages={book.totalPages}
              showLabel={false}
            />
            <p className="mt-2 text-xs text-muted">
              Page {book.currentPage}
              {book.totalPages > 0 ? ` of ${book.totalPages}` : ''}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-52">
          <Link
            href={ROUTES.reader(book.id)}
            className="inline-flex items-center justify-center rounded-md bg-tint px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Continue reading
          </Link>
        </div>
      </div>
    </section>
  );
}
