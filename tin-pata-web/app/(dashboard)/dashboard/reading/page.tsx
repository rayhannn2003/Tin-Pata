import Link from 'next/link';

import { ContinueReadingCard } from '@/components/dashboard/DashboardWidgets';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LinkedEmptyState } from '@/components/dashboard/LinkedEmptyState';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { BookService } from '@/services/BookService';
import { createCoverSignedUrl } from '@/services/coverSignedUrl.server';
import { progressPercent } from '@/types/book';
import { formatRelativeTime } from '@/utils/date';
import { ROUTES } from '@/utils/constants';

export default async function ReadingPage() {
  const books = await BookService.listForCurrentUser();
  const reading = books.filter((b) => b.status === 'reading');
  const paused = books.filter((b) => b.status === 'paused');
  const continueBook = reading[0] ?? null;

  const coverUrls = new Map<string, string | null>();
  await Promise.all(
    [...reading, ...paused].slice(0, 12).map(async (book) => {
      coverUrls.set(book.id, await createCoverSignedUrl(book.coverImagePath));
    }),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardHeader
        title="Reading"
        description="Continue in-progress books or resume paused titles in the web reader."
      />

      <SectionCard title="Continue reading" description="Your current title.">
        {continueBook ? (
          <ContinueReadingCard
            bookId={continueBook.id}
            title={continueBook.title}
            author={continueBook.author}
            currentPage={continueBook.currentPage}
            totalPages={continueBook.totalPages}
            percent={progressPercent(continueBook.currentPage, continueBook.totalPages)}
            coverUrl={coverUrls.get(continueBook.id)}
          />
        ) : (
          <LinkedEmptyState
            title="No book in progress"
            description="Mark a book as Reading in your library, or open any title from the list below."
            href={ROUTES.library}
            actionLabel="Go to library"
          />
        )}
      </SectionCard>

      <SectionCard title="In progress" description={`${reading.length} book(s) marked as reading.`}>
        {reading.length === 0 ? (
          <LinkedEmptyState
            title="Nothing in progress"
            description="Start a book from your library to see it here."
            href={ROUTES.library}
            actionLabel="Go to library"
          />
        ) : (
          <ul className="space-y-3">
            {reading.map((book) => (
              <li key={book.id}>
                <ContinueReadingCard
                  bookId={book.id}
                  title={book.title}
                  author={book.author}
                  currentPage={book.currentPage}
                  totalPages={book.totalPages}
                  percent={progressPercent(book.currentPage, book.totalPages)}
                  coverUrl={coverUrls.get(book.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {paused.length > 0 ? (
        <SectionCard title="Paused" description="Pick these up again when you’re ready.">
          <ul className="divide-y divide-border">
            {paused.map((book) => (
              <li key={book.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{book.title}</p>
                  <p className="text-xs text-muted">
                    Page {book.currentPage}
                    {book.lastReadAt ? ` · ${formatRelativeTime(book.lastReadAt)}` : ''}
                  </p>
                </div>
                <Link
                  href={ROUTES.reader(book.id)}
                  className="shrink-0 rounded-md bg-tint px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Resume
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}
