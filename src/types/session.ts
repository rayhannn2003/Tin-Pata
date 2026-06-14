export const MIN_SESSION_DURATION_SECONDS = 60;

export type SessionFocusOption = 'good' | 'medium' | 'bad';

export type SessionMoodOption =
  | 'motivated'
  | 'neutral'
  | 'bored'
  | 'sleepy'
  | 'distracted';

export type SessionBlockerOption =
  | 'phone'
  | 'sleepy'
  | 'hard_language'
  | 'boring'
  | 'busy'
  | 'stress'
  | 'other';

export interface ActiveReadingSession {
  bookId: string;
  startPage: number;
  startTimeMs: number;
  currentPage: number;
  isActive: boolean;
}

export interface FinishSessionInput {
  bookId: string;
  startPage: number;
  endPage: number;
  durationSeconds: number;
  focus?: SessionFocusOption | null;
  mood?: SessionMoodOption | null;
  blocker?: SessionBlockerOption | null;
}

export interface TodayReadingSummary {
  totalMinutes: number;
  totalPages: number;
  sessionCount: number;
}

export interface ReadingStatsSummary {
  totalSessions: number;
  totalMinutes: number;
  totalPages: number;
  todayMinutes: number;
  todayPages: number;
}

export interface SessionSaveResult {
  sessionId: string;
  pagesRead: number;
  durationSeconds: number;
  startPage: number;
  endPage: number;
}
