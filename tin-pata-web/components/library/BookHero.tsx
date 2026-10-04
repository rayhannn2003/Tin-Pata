import Link from 'next/link';

import { BookActionsMenu } from '@/components/library/BookActionsMenu';
import { BookCategoryBadge } from '@/components/library/BookCategoryBadge';
import { BookPriorityBadge } from '@/components/library/BookPriorityBadge';
import { BookProgress } from '@/components/library/BookProgress';
import { BookStatusBadge } from '@/components/library/BookStatusBadge';
import { createCoverSignedUrl } from '@/services/coverSignedUrl.server';
import type { Book } from '@/types/book';
import { progressPercent } from '@/types/book';
import { ROUTES } from '@/utils/constants';

interface BookHeroProps {
  book: Book;
}

export async function BookHero({ book }: BookHeroProps) {
  const percent = progressPercent(book.currentPage, book.totalPages);
  const coverUrl = await createCoverSignedUrl(book.coverImagePath);

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="relative hidden h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-tint-muted to-border/40 sm:block">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-2xl font-semibold text-tint">
                {book.title.trim().charAt(0).toUpperCase() || 'B'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Link href={ROUTES.library} className="text-xs font-medium text-tint hover:underline">
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
                hasCover={Boolean(book.coverImagePath)}
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
