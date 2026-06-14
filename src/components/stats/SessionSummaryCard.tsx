import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import type { TodayReadingSummary } from '@/types/session';

interface SessionSummaryCardProps {
  summary: TodayReadingSummary;
}

export function SessionSummaryCard({ summary }: SessionSummaryCardProps) {
  const sessionLabel =
    summary.sessionCount === 1 ? '1 session' : `${summary.sessionCount} sessions`;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <ThemedText variant="caption" secondary>
            Minutes
          </ThemedText>
          <ThemedText variant="subtitle">{summary.totalMinutes}</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText variant="caption" secondary>
            Pages
          </ThemedText>
          <ThemedText variant="subtitle">{summary.totalPages}</ThemedText>
        </View>
        <View style={styles.stat}>
          <ThemedText variant="caption" secondary>
            Sessions
          </ThemedText>
          <ThemedText variant="subtitle">{summary.sessionCount}</ThemedText>
        </View>
      </View>
      <ThemedText variant="caption" secondary>
        {summary.sessionCount === 0
          ? 'No reading sessions yet today.'
          : `${sessionLabel} logged today.`}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
});
