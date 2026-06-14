import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { GoalProgress } from '@/types/goal';
import { formatGoalProgressLine, formatGoalTitle } from '@/utils/format';

interface GoalProgressCardProps {
  progress: GoalProgress;
}

export function GoalProgressCard({ progress }: GoalProgressCardProps) {
  const colors = useThemeColors();

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">
        Today&apos;s goal: {formatGoalTitle(progress.goalType, progress.targetValue)}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {formatGoalProgressLine(progress.goalType, progress.currentValue, progress.targetValue)}
      </ThemedText>
      <ProgressBar
        progress={progress.percentage / 100}
        label={`${progress.percentage}%`}
      />
      <ThemedText
        variant="caption"
        style={{ color: progress.isCompleted ? colors.tint : undefined }}
        secondary={!progress.isCompleted}
      >
        {progress.message}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
});
