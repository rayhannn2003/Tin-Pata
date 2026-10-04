import { SettingsClient } from '@/components/settings/SettingsClient';
import { AnalyticsService } from '@/services/AnalyticsService';

export default async function SettingsPage() {
  const goal = await AnalyticsService.getActiveGoal();
  return (
    <SettingsClient initialGoalType={goal.goalType} initialGoalTarget={goal.targetValue} />
  );
}
