import type { ReadingSession } from '@/types';
import type { DayReadingSummary } from '@/types/goal';
import { getLocalDateKey } from '@/utils/date';

export const ReadingActivityService = {
  summarizeSessions(sessions: ReadingSession[]): Omit<DayReadingSummary, 'dateKey'> {
    const totalSeconds = sessions.reduce(
      (sum, s) => sum + Math.max(0, s.durationSeconds),
      0,
    );
    const pagesRead = sessions.reduce((sum, s) => sum + Math.max(0, s.pagesRead), 0);
    const sessionsCount = sessions.length;
    const minutesRead = Math.round(totalSeconds / 60);

    return {
      pagesRead,
      minutesRead,
      sessionsCount,
      hasReading: sessionsCount > 0,
    };
  },

  summarizeForDateKey(sessions: ReadingSession[], dateKey: string): DayReadingSummary {
    const daySessions = sessions.filter(
      (s) => getLocalDateKey(new Date(s.createdAt)) === dateKey,
    );
    return {
      dateKey,
      ...this.summarizeSessions(daySessions),
    };
  },

  groupSessionsByDateKey(sessions: ReadingSession[]): Map<string, ReadingSession[]> {
    const map = new Map<string, ReadingSession[]>();
    for (const session of sessions) {
      const key = getLocalDateKey(new Date(session.createdAt));
      const list = map.get(key) ?? [];
      list.push(session);
      map.set(key, list);
    }
    return map;
  },

  buildDailySummaries(sessions: ReadingSession[], dateKeys: string[]): DayReadingSummary[] {
    const grouped = this.groupSessionsByDateKey(sessions);
    return dateKeys.map((dateKey) => {
      const daySessions = grouped.get(dateKey) ?? [];
      return {
        dateKey,
        ...this.summarizeSessions(daySessions),
      };
    });
  },
};
