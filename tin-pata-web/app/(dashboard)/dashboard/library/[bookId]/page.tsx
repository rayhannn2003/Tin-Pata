import { notFound } from 'next/navigation';

import { BookHero } from '@/components/library/BookHero';
import { BookMetadataCard } from '@/components/library/BookMetadataCard';
import { BookStatsCard } from '@/components/library/BookStatsCard';
import { BookmarksPreview } from '@/components/library/BookmarksPreview';
import { NotesPreview } from '@/components/library/NotesPreview';
import { RecentSessionsCard } from '@/components/library/RecentSessionsCard';
import { BookService, LibraryAnnotationService } from '@/services/BookService';

interface BookDetailPageProps {
  params: Promise<{ bookId: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { bookId } = await params;
  const book = await BookService.getByIdForCurrentUser(bookId);
  if (!book) {
    notFound();
  }

  const [allSessions, notes, bookmarks] = await Promise.all([
    LibraryAnnotationService.listRecentSessions(bookId, 500),
    LibraryAnnotationService.listRecentNotes(bookId, 5),
    LibraryAnnotationService.listRecentBookmarks(bookId, 5),
  ]);

  const stats = LibraryAnnotationService.statsFromSessions(allSessions);
  const sessions = allSessions.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BookHero book={book} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <RecentSessionsCard sessions={sessions} />
          <div className="grid gap-6 md:grid-cols-2">
            <BookmarksPreview bookmarks={bookmarks} totalCount={book.bookmarkCount} />
            <NotesPreview notes={notes} totalCount={book.noteCount} />
          </div>
          <section
            aria-label="Coming soon"
            className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-5 text-sm text-muted"
          >
            <p className="font-medium text-foreground">Future</p>
            <p className="mt-1">
              Reading heatmap · AI summaries · Full notes &amp; bookmarks editors — not in this
              phase.
            </p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <BookStatsCard stats={stats} />
          <BookMetadataCard book={book} />
        </aside>
      </div>
    </div>
  );
}
