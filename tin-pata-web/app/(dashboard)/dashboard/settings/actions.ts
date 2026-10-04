'use server';

import { revalidatePath } from 'next/cache';

import { AnalyticsService } from '@/services/AnalyticsService';
import type { GoalType } from '@/types/analytics';
import { ROUTES } from '@/utils/constants';

export async function saveDailyGoalAction(
  goalType: GoalType,
  targetValue: number,
): Promise<{ ok: boolean; error?: string }> {
  const result = await AnalyticsService.saveActiveGoal(goalType, targetValue);
  if (result.ok) {
    revalidatePath(ROUTES.dashboard);
    revalidatePath(ROUTES.analytics);
    revalidatePath(ROUTES.settings);
  }
  return result;
}
