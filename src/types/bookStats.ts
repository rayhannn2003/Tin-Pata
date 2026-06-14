import type { ReadingSession } from '@/types';

export interface BookStats {
  totalSessions: number;
  totalMinutes: number;
  totalPagesRead: number;
  averagePagesPerSession: number;
  averageMinutesPerSession: number;
  lastReadAt: string | null;
  firstReadAt: string | null;
  bestSessionPages: number;
  bestSessionMinutes: number;
  canEstimateFinish: boolean;
  estimatedFinishDateKey: string | null;
  estimatedFinishDays: number | null;
  averagePagesPerReadingDay: number;
}

export interface BookStatsWithSessions extends BookStats {
  recentSessions: ReadingSession[];
}
