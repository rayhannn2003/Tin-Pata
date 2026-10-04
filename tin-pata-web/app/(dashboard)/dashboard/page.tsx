import Link from 'next/link';

import { ContinueReadingCard, HabitCalendar } from '@/components/dashboard/DashboardWidgets';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LinkedEmptyState } from '@/components/dashboard/LinkedEmptyState';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { BookService } from '@/services/BookService';
import { AnalyticsService } from '@/services/AnalyticsService';
import { createCoverSignedUrl } from '@/services/coverSignedUrl.server';
import { progressPercent } from '@/types/book';
import { formatRelativeTime } from '@/utils/date';
import { ROUTES } from '@/utils/constants';

export default async function DashboardHomePage() {
  const [books, goalProgress, weekly, streak, recentNotes, recentBookmarks] = await Promise.all([
    BookService.listForCurrentUser(),
    AnalyticsService.getGoalProgress(),
    AnalyticsService.getWeeklyStats(7),
    AnalyticsService.getStreak(90),
    AnalyticsService.listRecentNotes(5),
    AnalyticsService.listRecentBookmarks(5),
  ]);

  const continueBook =
    books.find((b) => b.status === 'reading') ??
    books.find((b) => b.currentPage > 1) ??
    null;
  const inProgressCount = books.filter((b) => b.status === 'reading').length;
  const recentBooks = books.slice(0, 5);

  const continueCoverUrl = continueBook?.coverImagePath
    ? await createCoverSignedUrl(continueBook.coverImagePath)
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardHeader
        title="Dashboard"
        description="Your reading overview — goals, streak, and recent activity synced from Tin Pata."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Reading goal"
          value={`${goalProgress.currentValue}/${goalProgress.targetValue}`}
          hint={goalProgress.label}
        />
        <StatCard
          label="Weekly reading"
          value={`${weekly.totalMinutesThisWeek}m`}
          hint={`${weekly.totalPagesThisWeek} pages this week`}
        />
        <StatCard
          label="Current streak"
          value={String(streak.currentStreak)}
          hint={`Longest ${streak.longestStreak} days`}
        />
        <StatCard
          label="Books in progress"
          value={String(inProgressCount)}
          hint={`${books.length} in library`}
        />
      </div>

      <SectionCard title="This week" description="Habit calendar from your reading sessions.">
        <HabitCalendar days={weekly.habitCalendar} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Continue reading" description="Pick up where you left off.">
          {continueBook ? (
            <ContinueReadingCard
              bookId={continueBook.id}
              title={continueBook.title}
              author={continueBook.author}
              currentPage={continueBook.currentPage}
              totalPages={continueBook.totalPages}
              percent={progressPercent(continueBook.currentPage, continueBook.totalPages)}
              coverUrl={continueCoverUrl}
            />
          ) : books.length === 0 ? (
            <LinkedEmptyState
              title="No books yet"
              description="Import a PDF on mobile or upload one from the web library."
              href={ROUTES.library}
              actionLabel="Go to library"
            />
          ) : (
            <LinkedEmptyState
              title="No book in progress yet"
              description="Mark a title as Reading in your library to continue here."
              href={ROUTES.library}
              actionLabel="Go to library"
            />
          )}
        </SectionCard>

        <SectionCard title="Recent books" description="What you’ve opened lately.">
          {recentBooks.length === 0 ? (
            <LinkedEmptyState
              title="No recent books"
              description="Titles appear here after you sync or upload books."
              href={ROUTES.library}
              actionLabel="Go to library"
            />
          ) : (
            <ul className="space-y-2">
              {recentBooks.map((book) => (
                <li key={book.id}>
                  <Link
                    href={ROUTES.book(book.id)}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-tint-muted"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-foreground">
                      {book.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {book.lastReadAt ? formatRelativeTime(book.lastReadAt) : '—'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent notes" description="Thoughts from your reading.">
          {recentNotes.length === 0 ? (
            <DashboardNotesEmpty />
          ) : (
            <ul className="space-y-3">
              {recentNotes.map((note) => (
                <li key={note.id} className="rounded-lg border border-border/70 px-3 py-2">
                  <Link href={ROUTES.reader(note.bookId)} className="block">
                    <p className="text-xs font-medium text-tint">{note.bookTitle}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground">{note.noteText}</p>
                    <p className="mt-1 text-xs text-muted">
                      Page {note.pageNumber} · {formatRelativeTime(note.updatedAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Recent bookmarks" description="Pages you marked.">
          {recentBookmarks.length === 0 ? (
            <DashboardBookmarksEmpty />
          ) : (
            <ul className="space-y-2">
              {recentBookmarks.map((bookmark) => (
                <li key={bookmark.id}>
                  <Link
                    href={ROUTES.reader(bookmark.bookId)}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-tint-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {bookmark.title || `Page ${bookmark.pageNumber}`}
                      </span>
                      <span className="block truncate text-xs text-muted">{bookmark.bookTitle}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted">p. {bookmark.pageNumber}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function DashboardNotesEmpty() {
  return (
    <LinkedEmptyState
      title="No notes yet"
      description="Notes you capture while reading will list here."
    />
  );
}

function DashboardBookmarksEmpty() {
  return (
    <LinkedEmptyState
      title="No bookmarks yet"
      description="Bookmarks from the reader will appear in this section."
    />
  );
}
