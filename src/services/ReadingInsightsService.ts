import { BookRepository } from '@/db/repositories/BookRepository';
import { SessionRepository } from '@/db/repositories/SessionRepository';
import { ReadingActivityService } from '@/services/ReadingActivityService';
import type { Mood, ReadingSession } from '@/types';
import type { ReadingInsights, ReadingTimeRangeKey } from '@/types/insights';

const TIME_RANGE_BUCKETS: { key: ReadingTimeRangeKey; startHour: number; endHour: number }[] = [
  { key: 'insights.timeRange.earlyMorning', startHour: 5, endHour: 9 },
  { key: 'insights.timeRange.morning', startHour: 9, endHour: 12 },
  { key: 'insights.timeRange.afternoon', startHour: 12, endHour: 17 },
  { key: 'insights.timeRange.evening', startHour: 17, endHour: 21 },
  { key: 'insights.timeRange.night', startHour: 21, endHour: 5 },
];

const MOOD_KEYS: Record<Mood, string> = {
  motivated: 'insights.mood.motivated',
  calm: 'insights.mood.calm',
  tired: 'insights.mood.tired',
  distracted: 'insights.mood.distracted',
  stuck: 'insights.mood.stuck',
};

const FOCUS_KEYS: Record<number, string> = {
  5: 'insights.focus.good',
  3: 'insights.focus.medium',
  1: 'insights.focus.low',
};

const BLOCKER_KEYS: Record<string, string> = {
  Phone: 'insights.blocker.phone',
  Sleepy: 'insights.blocker.sleepy',
  'Hard language': 'insights.blocker.hardLanguage',
  Boring: 'insights.blocker.boring',
  Busy: 'insights.blocker.busy',
  Stress: 'insights.blocker.stress',
  Other: 'insights.blocker.other',
};

function roundAverage(total: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.round((total / count) * 10) / 10;
}

function resolveTimeRangeKey(hour: number): ReadingTimeRangeKey {
  for (const bucket of TIME_RANGE_BUCKETS) {
    if (bucket.startHour < bucket.endHour) {
      if (hour >= bucket.startHour && hour < bucket.endHour) {
        return bucket.key;
      }
    } else if (hour >= bucket.startHour || hour < bucket.endHour) {
      return bucket.key;
    }
  }
  return 'insights.timeRange.afternoon';
}

function mostCommonValue(values: string[]): string | null {
  if (values.length === 0) {
    return null;
  }
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function buildBestReadingDay(sessions: ReadingSession[]): ReadingInsights['bestReadingDay'] {
  const grouped = ReadingActivityService.groupSessionsByDateKey(sessions);
  let best: ReadingInsights['bestReadingDay'] = null;

  for (const [dateKey, daySessions] of grouped) {
    const pagesRead = daySessions.reduce((sum, s) => sum + s.pagesRead, 0);
    if (!best || pagesRead > best.pagesRead) {
      best = { dateKey, pagesRead };
    }
  }

  return best;
}

function buildBestTimeRange(sessions: ReadingSession[]): ReadingTimeRangeKey | null {
  if (sessions.length === 0) {
    return null;
  }

  const bucketPages = new Map<ReadingTimeRangeKey, number>();
  for (const session of sessions) {
    const hour = new Date(session.createdAt).getHours();
    const key = resolveTimeRangeKey(hour);
    bucketPages.set(key, (bucketPages.get(key) ?? 0) + session.pagesRead);
  }

  let bestKey: ReadingTimeRangeKey | null = null;
  let bestPages = 0;
  for (const [key, pages] of bucketPages) {
    if (pages > bestPages) {
      bestKey = key;
      bestPages = pages;
    }
  }

  return bestKey;
}

function buildMostReadBook(
  sessions: ReadingSession[],
  bookTitles: Map<string, string>,
): ReadingInsights['mostReadBook'] {
  const pagesByBook = new Map<string, number>();
  for (const session of sessions) {
    pagesByBook.set(session.bookId, (pagesByBook.get(session.bookId) ?? 0) + session.pagesRead);
  }

  let best: ReadingInsights['mostReadBook'] = null;
  for (const [bookId, pagesRead] of pagesByBook) {
    if (!best || pagesRead > best.pagesRead) {
      best = {
        bookId,
        title: bookTitles.get(bookId) ?? 'Unknown book',
        pagesRead,
      };
    }
  }

  return best;
}

export const ReadingInsightsService = {
  async getReadingInsights(): Promise<ReadingInsights> {
    const [sessions, books] = await Promise.all([
      SessionRepository.getAllSessions(),
      BookRepository.getAllBooks(),
    ]);

    if (sessions.length === 0) {
      return {
        bestReadingDay: null,
        bestTimeRangeKey: null,
        averageSessionDurationMinutes: 0,
        averagePagesPerSession: 0,
        totalReadingDays: 0,
        mostCommonBlockerKey: null,
        mostCommonMoodKey: null,
        mostCommonFocusKey: null,
        longestSessionMinutes: 0,
        longestSessionPages: 0,
        mostReadBook: null,
      };
    }

    const bookTitles = new Map(books.map((book) => [book.id, book.title]));
    const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
    const totalMinutes = sessions.reduce(
      (sum, s) => sum + Math.round(s.durationSeconds / 60),
      0,
    );

    const longest = sessions.reduce(
      (best, session) => (session.durationSeconds > best.durationSeconds ? session : best),
      sessions[0],
    );

    const moodKeys = sessions
      .filter((s) => s.mood)
      .map((s) => MOOD_KEYS[s.mood as Mood]);
    const focusKeys = sessions
      .filter((s) => s.focusLevel !== null)
      .map((s) => FOCUS_KEYS[s.focusLevel as number])
      .filter(Boolean);
    const blockerKeys = sessions
      .filter((s) => s.blockerReason)
      .map((s) => BLOCKER_KEYS[s.blockerReason as string] ?? s.blockerReason as string);

    return {
      bestReadingDay: buildBestReadingDay(sessions),
      bestTimeRangeKey: buildBestTimeRange(sessions),
      averageSessionDurationMinutes: roundAverage(totalMinutes, sessions.length),
      averagePagesPerSession: roundAverage(totalPages, sessions.length),
      totalReadingDays: ReadingActivityService.groupSessionsByDateKey(sessions).size,
      mostCommonBlockerKey: mostCommonValue(blockerKeys),
      mostCommonMoodKey: mostCommonValue(moodKeys),
      mostCommonFocusKey: mostCommonValue(focusKeys),
      longestSessionMinutes: Math.round(longest.durationSeconds / 60),
      longestSessionPages: longest.pagesRead,
      mostReadBook: buildMostReadBook(sessions, bookTitles),
    };
  },
};
