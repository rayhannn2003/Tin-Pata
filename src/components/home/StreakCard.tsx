import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { StreakSummary } from '@/types/goal';

interface StreakCardProps {
  streak: StreakSummary;
}

export function StreakCard({ streak }: StreakCardProps) {
  const colors = useThemeColors();

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <ThemedText variant="caption" secondary>
            Current streak
          </ThemedText>
          <ThemedText variant="title" style={styles.value}>
            {streak.currentStreak}
          </ThemedText>
          <ThemedText variant="caption" secondary>
            {streak.currentStreak === 1 ? 'day' : 'days'}
          </ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText variant="caption" secondary>
            Longest
          </ThemedText>
          <ThemedText variant="title" style={styles.value}>
            {streak.longestStreak}
          </ThemedText>
          <ThemedText variant="caption" secondary>
            {streak.longestStreak === 1 ? 'day' : 'days'}
          </ThemedText>
        </View>
      </View>
      <ThemedText variant="caption" style={{ color: colors.tint }}>
        {streak.recoveryMessage}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  row: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: { gap: 2 },
  value: { fontSize: 28 },
});
