export type ReadingTimeRangeKey =
  | 'insights.timeRange.earlyMorning'
  | 'insights.timeRange.morning'
  | 'insights.timeRange.afternoon'
  | 'insights.timeRange.evening'
  | 'insights.timeRange.night';

export interface ReadingInsights {
  bestReadingDay: { dateKey: string; pagesRead: number } | null;
  bestTimeRangeKey: ReadingTimeRangeKey | null;
  averageSessionDurationMinutes: number;
  averagePagesPerSession: number;
  totalReadingDays: number;
  mostCommonBlockerKey: string | null;
  mostCommonMoodKey: string | null;
  mostCommonFocusKey: string | null;
  longestSessionMinutes: number;
  longestSessionPages: number;
  mostReadBook: { bookId: string; title: string; pagesRead: number } | null;
}

export const EMPTY_READING_INSIGHTS: ReadingInsights = {
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
