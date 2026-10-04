export type GoalType = 'pages' | 'minutes' | 'sessions';

export interface DailyGoalSummary {
  id: string | null;
  goalType: GoalType;
  targetValue: number;
  isActive: boolean;
}

export interface DayReadingSummary {
  dateKey: string;
  label: string;
  pagesRead: number;
  minutesRead: number;
  sessionsCount: number;
  hasReading: boolean;
  goalCompleted: boolean;
}

export type HabitDayStatus = 'completed' | 'partial' | 'empty';

export interface HabitCalendarDay {
  dateKey: string;
  label: string;
  status: HabitDayStatus;
}

export interface GoalProgressSummary {
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  percentage: number;
  isCompleted: boolean;
  remainingValue: number;
  label: string;
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
}

export interface WeeklyStatsSummary {
  totalPagesThisWeek: number;
  totalMinutesThisWeek: number;
  totalSessionsThisWeek: number;
  readingDaysThisWeek: number;
  completedGoalDaysThisWeek: number;
  bestReadingDay: DayReadingSummary | null;
  dailyBreakdown: DayReadingSummary[];
  habitCalendar: HabitCalendarDay[];
}

export interface AllTimeStats {
  totalSessions: number;
  totalMinutes: number;
  totalPages: number;
  todayPages: number;
  todayMinutes: number;
}

export interface ReadingInsights {
  bestReadingDay: { dateKey: string; pagesRead: number } | null;
  averagePagesPerSession: number;
  averageMinutesPerSession: number;
  longestSessionMinutes: number;
  mostReadBookTitle: string | null;
}

export interface AnnotatedNote {
  id: string;
  bookId: string;
  bookTitle: string;
  pageNumber: number;
  noteText: string;
  updatedAt: string;
}

export interface AnnotatedBookmark {
  id: string;
  bookId: string;
  bookTitle: string;
  pageNumber: number;
  title: string | null;
  createdAt: string;
}

export const DEFAULT_GOAL_TYPE: GoalType = 'pages';
export const DEFAULT_GOAL_TARGET = 5;

export function formatGoalTypeLabel(goalType: GoalType): string {
  switch (goalType) {
    case 'pages':
      return 'pages';
    case 'minutes':
      return 'minutes';
    case 'sessions':
      return 'sessions';
    default:
      return goalType;
  }
}

export function formatGoalLabel(goalType: GoalType, target: number): string {
  return `${target} ${formatGoalTypeLabel(goalType)} / day`;
}
