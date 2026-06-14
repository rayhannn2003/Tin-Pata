import { BookRepository } from '@/db/repositories/BookRepository';
import { SessionRepository } from '@/db/repositories/SessionRepository';
import { ReadingActivityService } from '@/services/ReadingActivityService';
import type { Book } from '@/types';
import type { BookStats, BookStatsWithSessions } from '@/types/bookStats';
import { getLocalDateKey } from '@/utils/date';

const RECENT_SESSION_LIMIT = 8;
const MIN_READING_DAYS_FOR_ESTIMATE = 2;

function roundAverage(total: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.round((total / count) * 10) / 10;
}

function computeFinishEstimate(
  book: Book,
  sessions: Awaited<ReturnType<typeof SessionRepository.getSessionsByBookId>>,
): Pick<
  BookStats,
  'canEstimateFinish' | 'estimatedFinishDateKey' | 'estimatedFinishDays' | 'averagePagesPerReadingDay'
> {
  const empty = {
    canEstimateFinish: false,
    estimatedFinishDateKey: null,
    estimatedFinishDays: null,
    averagePagesPerReadingDay: 0,
  };

  if (book.totalPages <= 0 || sessions.length === 0) {
    return empty;
  }

  const remainingPages = Math.max(0, book.totalPages - book.currentPage);
  if (remainingPages <= 0) {
    return { ...empty, estimatedFinishDays: 0 };
  }

  const readingDays = ReadingActivityService.groupSessionsByDateKey(sessions).size;
  const totalPagesRead = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const averagePagesPerReadingDay = roundAverage(totalPagesRead, readingDays);

  if (readingDays < MIN_READING_DAYS_FOR_ESTIMATE || averagePagesPerReadingDay <= 0) {
    return { ...empty, averagePagesPerReadingDay };
  }

  const estimatedFinishDays = Math.ceil(remainingPages / averagePagesPerReadingDay);
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + estimatedFinishDays);

  return {
    canEstimateFinish: true,
    estimatedFinishDateKey: getLocalDateKey(finishDate),
    estimatedFinishDays,
    averagePagesPerReadingDay,
  };
}

function buildStatsFromSessions(
  book: Book,
  sessions: Awaited<ReturnType<typeof SessionRepository.getSessionsByBookId>>,
): BookStats {
  const finishEstimate = computeFinishEstimate(book, sessions);

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      totalPagesRead: 0,
      averagePagesPerSession: 0,
      averageMinutesPerSession: 0,
      lastReadAt: null,
      firstReadAt: null,
      bestSessionPages: 0,
      bestSessionMinutes: 0,
      ...finishEstimate,
    };
  }

  const totalPagesRead = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
  const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const bestSessionPages = Math.max(...sessions.map((s) => s.pagesRead));
  const bestSessionMinutes = Math.max(
    ...sessions.map((s) => Math.round(s.durationSeconds / 60)),
  );

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    totalSessions: sessions.length,
    totalMinutes,
    totalPagesRead,
    averagePagesPerSession: roundAverage(totalPagesRead, sessions.length),
    averageMinutesPerSession: roundAverage(totalMinutes, sessions.length),
    lastReadAt: sorted[0]?.createdAt ?? null,
    firstReadAt: sorted[sorted.length - 1]?.createdAt ?? null,
    bestSessionPages,
    bestSessionMinutes,
    ...finishEstimate,
  };
}

export const BookStatsService = {
  async getBookStats(bookId: string): Promise<BookStats> {
    const [book, sessions] = await Promise.all([
      BookRepository.getBookById(bookId),
      SessionRepository.getSessionsByBookId(bookId),
    ]);
    if (!book) {
      throw new Error('Book not found.');
    }
    return buildStatsFromSessions(book, sessions);
  },

  async getBookStatsWithSessions(bookId: string): Promise<BookStatsWithSessions> {
    const [book, sessions] = await Promise.all([
      BookRepository.getBookById(bookId),
      SessionRepository.getSessionsByBookId(bookId),
    ]);
    if (!book) {
      throw new Error('Book not found.');
    }
    return {
      ...buildStatsFromSessions(book, sessions),
      recentSessions: sessions.slice(0, RECENT_SESSION_LIMIT),
    };
  },
};
