import { SessionRepository } from '@/db/repositories/SessionRepository';
import type { BookStats, BookStatsWithSessions } from '@/types/bookStats';

const RECENT_SESSION_LIMIT = 8;

function roundAverage(total: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.round((total / count) * 10) / 10;
}

function buildStatsFromSessions(
  sessions: Awaited<ReturnType<typeof SessionRepository.getSessionsByBookId>>,
): BookStats {
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
  };
}

export const BookStatsService = {
  async getBookStats(bookId: string): Promise<BookStats> {
    const sessions = await SessionRepository.getSessionsByBookId(bookId);
    return buildStatsFromSessions(sessions);
  },

  async getBookStatsWithSessions(bookId: string): Promise<BookStatsWithSessions> {
    const sessions = await SessionRepository.getSessionsByBookId(bookId);
    return {
      ...buildStatsFromSessions(sessions),
      recentSessions: sessions.slice(0, RECENT_SESSION_LIMIT),
    };
  },
};
