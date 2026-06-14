import { GoalService } from '@/services/GoalService';
import { ReadingActivityService } from '@/services/ReadingActivityService';
import { SessionRepository } from '@/db/repositories/SessionRepository';
import { translate } from '@/i18n/translate';
import { LanguageService } from '@/services/LanguageService';
import type { DailyGoal } from '@/types';
import type { DayReadingSummary, StreakSummary } from '@/types/goal';
import {
  getLastNDays,
  getLocalDateKey,
  getTodayDateKey,
  getYesterdayDateKey,
} from '@/utils/date';

const STREAK_LOOKBACK_DAYS = 365;

export const StreakService = {
  async isDateGoalCompleted(dateKey: string, goal: DailyGoal): Promise<boolean> {
    const summary = await this.getDaySummary(dateKey);
    return GoalService.isGoalCompleted(
      GoalService.getCurrentValueForGoal(goal.goalType, {
        totalPages: summary.pagesRead,
        totalMinutes: summary.minutesRead,
        sessionCount: summary.sessionsCount,
      }),
      goal.targetValue,
    );
  },

  async getDaySummary(dateKey: string): Promise<DayReadingSummary> {
    const sessions = await SessionRepository.getAllSessions();
    return ReadingActivityService.summarizeForDateKey(sessions, dateKey);
  },

  async getDailySuccessMap(goal: DailyGoal, dateKeys: string[]): Promise<Map<string, boolean>> {
    const sessions = await SessionRepository.getAllSessions();
    const summaries = ReadingActivityService.buildDailySummaries(sessions, dateKeys);
    const map = new Map<string, boolean>();

    for (const summary of summaries) {
      const currentValue = GoalService.getCurrentValueForGoal(goal.goalType, {
        totalPages: summary.pagesRead,
        totalMinutes: summary.minutesRead,
        sessionCount: summary.sessionsCount,
      });
      map.set(summary.dateKey, GoalService.isGoalCompleted(currentValue, goal.targetValue));
    }

    return map;
  },

  countConsecutiveCompleted(dateKeysDesc: string[], successMap: Map<string, boolean>): number {
    let count = 0;
    for (const key of dateKeysDesc) {
      if (successMap.get(key)) {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  },

  calculateLongestStreak(dateKeysAsc: string[], successMap: Map<string, boolean>): number {
    let longest = 0;
    let current = 0;
    for (const key of dateKeysAsc) {
      if (successMap.get(key)) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  },

  getRecoveryMessageKey(summary: Omit<StreakSummary, 'recoveryMessage'>): string {
    if (summary.todayCompleted) {
      return 'streak.completedToday';
    }
    if (summary.yesterdayCompleted && !summary.todayCompleted) {
      return 'streak.protectStreak';
    }
    if (summary.missedYesterday) {
      return 'streak.missedYesterday';
    }
    if (summary.currentStreak === 0) {
      return 'streak.startSmall';
    }
    return 'streak.notReadToday';
  },

  async getCurrentStreak(goal: DailyGoal): Promise<number> {
    const todayKey = getTodayDateKey();
    const dateKeys = getLastNDays(STREAK_LOOKBACK_DAYS);
    const successMap = await this.getDailySuccessMap(goal, dateKeys);
    const todayCompleted = successMap.get(todayKey) ?? false;

    const keysDesc = [...dateKeys].reverse();
    if (todayCompleted) {
      return this.countConsecutiveCompleted(keysDesc, successMap);
    }

    const fromYesterday = keysDesc.filter((k) => k !== todayKey);
    return this.countConsecutiveCompleted(fromYesterday, successMap);
  },

  async getLongestStreak(goal: DailyGoal): Promise<number> {
    const dateKeys = getLastNDays(STREAK_LOOKBACK_DAYS);
    const successMap = await this.getDailySuccessMap(goal, dateKeys);
    return this.calculateLongestStreak(dateKeys, successMap);
  },

  async getStreakSummary(): Promise<StreakSummary> {
    const goal = await GoalService.ensureDefaultGoal();
    const todayKey = getTodayDateKey();
    const yesterdayKey = getYesterdayDateKey();

    const todaySummary = await this.getDaySummary(todayKey);
    const yesterdaySummary = await this.getDaySummary(yesterdayKey);

    const todayCompleted = GoalService.isGoalCompleted(
      GoalService.getCurrentValueForGoal(goal.goalType, {
        totalPages: todaySummary.pagesRead,
        totalMinutes: todaySummary.minutesRead,
        sessionCount: todaySummary.sessionsCount,
      }),
      goal.targetValue,
    );

    const yesterdayCompleted = GoalService.isGoalCompleted(
      GoalService.getCurrentValueForGoal(goal.goalType, {
        totalPages: yesterdaySummary.pagesRead,
        totalMinutes: yesterdaySummary.minutesRead,
        sessionCount: yesterdaySummary.sessionsCount,
      }),
      goal.targetValue,
    );

    const currentStreak = await this.getCurrentStreak(goal);
    const longestStreak = await this.getLongestStreak(goal);
    const missedYesterday = !yesterdayCompleted;

    const base = {
      currentStreak,
      longestStreak,
      todayCompleted,
      yesterdayCompleted,
      missedYesterday,
    };

    const language = await LanguageService.getLanguage();

    return {
      ...base,
      recoveryMessage: translate(this.getRecoveryMessageKey(base), language),
    };
  },
};
