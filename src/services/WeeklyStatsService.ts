import { GoalService } from '@/services/GoalService';
import { ReadingActivityService } from '@/services/ReadingActivityService';
import { SessionRepository } from '@/db/repositories/SessionRepository';
import type { DailyGoal } from '@/types';
import type {
  DailyBreakdownItem,
  HabitCalendarDay,
  HabitDayStatus,
  WeeklyStatsSummary,
} from '@/types/goal';
import { formatDayLabel, getLastNDays } from '@/utils/date';

const WEEK_DAYS = 7;

export const WeeklyStatsService = {
  resolveHabitStatus(summary: DailyBreakdownItem): HabitDayStatus {
    if (summary.goalCompleted) {
      return 'completed';
    }
    if (summary.hasReading) {
      return 'partial';
    }
    return 'empty';
  },

  buildBreakdownItem(
    summary: {
      dateKey: string;
      pagesRead: number;
      minutesRead: number;
      sessionsCount: number;
      hasReading: boolean;
    },
    goal: DailyGoal,
  ): DailyBreakdownItem {
    const currentValue = GoalService.getCurrentValueForGoal(goal.goalType, {
      totalPages: summary.pagesRead,
      totalMinutes: summary.minutesRead,
      sessionCount: summary.sessionsCount,
    });
    const goalCompleted = GoalService.isGoalCompleted(currentValue, goal.targetValue);

    return {
      dateKey: summary.dateKey,
      label: formatDayLabel(summary.dateKey),
      pagesRead: summary.pagesRead,
      minutesRead: summary.minutesRead,
      sessionsCount: summary.sessionsCount,
      goalCompleted,
      hasReading: summary.hasReading,
    };
  },

  async getWeeklyStats(): Promise<WeeklyStatsSummary> {
    const goal = await GoalService.ensureDefaultGoal();
    const dateKeys = getLastNDays(WEEK_DAYS);
    const sessions = await SessionRepository.getAllSessions();
    const summaries = ReadingActivityService.buildDailySummaries(sessions, dateKeys);

    const dailyBreakdown = summaries.map((s) => this.buildBreakdownItem(s, goal));

    const totalPagesThisWeek = dailyBreakdown.reduce((sum, d) => sum + d.pagesRead, 0);
    const totalMinutesThisWeek = dailyBreakdown.reduce((sum, d) => sum + d.minutesRead, 0);
    const totalSessionsThisWeek = dailyBreakdown.reduce((sum, d) => sum + d.sessionsCount, 0);
    const readingDaysThisWeek = dailyBreakdown.filter((d) => d.hasReading).length;
    const completedGoalDaysThisWeek = dailyBreakdown.filter((d) => d.goalCompleted).length;

    const bestReadingDay =
      dailyBreakdown.reduce<DailyBreakdownItem | null>((best, day) => {
        if (!day.hasReading) {
          return best;
        }
        if (!best || day.pagesRead > best.pagesRead) {
          return day;
        }
        return best;
      }, null);

    const habitCalendar: HabitCalendarDay[] = dailyBreakdown.map((day) => ({
      dateKey: day.dateKey,
      label: day.label,
      status: this.resolveHabitStatus(day),
    }));

    return {
      totalPagesThisWeek,
      totalMinutesThisWeek,
      totalSessionsThisWeek,
      readingDaysThisWeek,
      completedGoalDaysThisWeek,
      bestReadingDay,
      dailyBreakdown,
      habitCalendar,
    };
  },
};
