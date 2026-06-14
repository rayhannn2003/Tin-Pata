import type { GoalType } from '@/types';

export interface DayReadingSummary {
  dateKey: string;
  pagesRead: number;
  minutesRead: number;
  sessionsCount: number;
  hasReading: boolean;
}

export interface GoalProgress {
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  percentage: number;
  isCompleted: boolean;
  remainingValue: number;
  message: string;
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  yesterdayCompleted: boolean;
  missedYesterday: boolean;
  recoveryMessage: string;
}

export interface DailyBreakdownItem {
  dateKey: string;
  label: string;
  pagesRead: number;
  minutesRead: number;
  sessionsCount: number;
  goalCompleted: boolean;
  hasReading: boolean;
}

export type HabitDayStatus = 'completed' | 'partial' | 'empty';

export interface HabitCalendarDay {
  dateKey: string;
  label: string;
  status: HabitDayStatus;
}

export interface WeeklyStatsSummary {
  totalPagesThisWeek: number;
  totalMinutesThisWeek: number;
  totalSessionsThisWeek: number;
  readingDaysThisWeek: number;
  completedGoalDaysThisWeek: number;
  bestReadingDay: DailyBreakdownItem | null;
  dailyBreakdown: DailyBreakdownItem[];
  habitCalendar: HabitCalendarDay[];
}

export const DEFAULT_GOAL_TYPE: GoalType = 'pages';
export const DEFAULT_GOAL_TARGET = 5;
