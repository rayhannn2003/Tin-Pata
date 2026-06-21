import { GoalRepository } from '@/db/repositories/GoalRepository';
import { ReadingSessionService } from '@/services/ReadingSessionService';
import type { DailyGoal, GoalType } from '@/types';
import type { GoalProgress } from '@/types/goal';
import { DEFAULT_GOAL_TARGET, DEFAULT_GOAL_TYPE } from '@/types/goal';
import { formatGoalProgressLine, formatGoalTypeLabel } from '@/utils/format';
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/ids';
import { emptySyncMetadata } from '@/utils/syncMetadata';

export class GoalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoalError';
  }
}

export const GoalService = {
  async getActiveGoal(): Promise<DailyGoal | null> {
    return GoalRepository.getActiveGoal();
  },

  async ensureDefaultGoal(): Promise<DailyGoal> {
    const existing = await GoalRepository.getActiveGoal();
    if (existing) {
      return existing;
    }

    const now = nowIso();
    const goal: DailyGoal = {
      id: await generateId(),
      goalType: DEFAULT_GOAL_TYPE,
      targetValue: DEFAULT_GOAL_TARGET,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...emptySyncMetadata(),
    };
    await GoalRepository.createGoal(goal);
    return goal;
  },

  validateTargetValue(value: number): void {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
      throw new GoalError('Target must be a positive whole number.');
    }
  },

  validateGoalType(goalType: GoalType): void {
    if (!['pages', 'minutes', 'sessions'].includes(goalType)) {
      throw new GoalError('Invalid goal type.');
    }
  },

  async updateActiveGoal(goalType: GoalType, targetValue: number): Promise<DailyGoal> {
    this.validateGoalType(goalType);
    this.validateTargetValue(targetValue);

    const now = nowIso();
    const goal: DailyGoal = {
      id: await generateId(),
      goalType,
      targetValue,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...emptySyncMetadata(),
    };
    await GoalRepository.setActiveGoal(goal);
    return goal;
  },

  getCurrentValueForGoal(
    goalType: GoalType,
    today: { totalPages: number; totalMinutes: number; sessionCount: number },
  ): number {
    switch (goalType) {
      case 'pages':
        return today.totalPages;
      case 'minutes':
        return today.totalMinutes;
      case 'sessions':
        return today.sessionCount;
      default:
        return 0;
    }
  },

  calculateGoalPercentage(currentValue: number, targetValue: number): number {
    if (targetValue <= 0) {
      return 0;
    }
    return Math.min(Math.round((currentValue / targetValue) * 100), 100);
  },

  isGoalCompleted(currentValue: number, targetValue: number): boolean {
    return currentValue >= targetValue;
  },

  buildProgressMessage(
    goalType: GoalType,
    currentValue: number,
    targetValue: number,
    isCompleted: boolean,
  ): string {
    if (isCompleted) {
      return 'Goal completed. You kept your reading habit alive today.';
    }

    const remaining = Math.max(0, targetValue - currentValue);
    if (remaining === 0) {
      return 'Goal completed. You kept your reading habit alive today.';
    }

    const unit = formatGoalTypeLabel(goalType, remaining);
    if (remaining === 1 && goalType === 'pages') {
      return 'Read 1 page to restart.';
    }
    return `${remaining} ${unit} left today.`;
  },

  buildGoalProgress(
    goal: DailyGoal,
    today: { totalPages: number; totalMinutes: number; sessionCount: number },
  ): GoalProgress {
    const currentValue = this.getCurrentValueForGoal(goal.goalType, today);
    const targetValue = goal.targetValue;
    const isCompleted = this.isGoalCompleted(currentValue, targetValue);
    const remainingValue = Math.max(0, targetValue - currentValue);
    const percentage = this.calculateGoalPercentage(currentValue, targetValue);
    const message = this.buildProgressMessage(
      goal.goalType,
      currentValue,
      targetValue,
      isCompleted,
    );

    return {
      goalType: goal.goalType,
      targetValue,
      currentValue,
      percentage,
      isCompleted,
      remainingValue,
      message,
    };
  },

  async getTodayGoalProgress(): Promise<{ goal: DailyGoal; progress: GoalProgress }> {
    const goal = await this.ensureDefaultGoal();
    const today = await ReadingSessionService.getTodayReadingSummary();
    const progress = this.buildGoalProgress(goal, today);
    return { goal, progress };
  },

  async isTodayGoalCompleted(): Promise<boolean> {
    const { progress } = await this.getTodayGoalProgress();
    return progress.isCompleted;
  },
};
