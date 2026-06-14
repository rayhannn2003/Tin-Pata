import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { HabitCalendarDay, HabitDayStatus } from '@/types/goal';

interface HabitCalendarProps {
  days: HabitCalendarDay[];
}

function statusSymbol(status: HabitDayStatus): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'partial':
      return '◐';
    case 'empty':
      return '○';
    default:
      return '○';
  }
}

function DayCell({ day }: { day: HabitCalendarDay }) {
  const colors = useThemeColors();
  const isPartial = day.status === 'partial';

  return (
    <View style={styles.dayCell}>
      <ThemedText variant="caption" secondary>
        {day.label}
      </ThemedText>
      <ThemedText
        variant="subtitle"
        style={isPartial ? { color: colors.tint } : undefined}
      >
        {statusSymbol(day.status)}
      </ThemedText>
    </View>
  );
}

export function HabitCalendar({ days }: HabitCalendarProps) {
  return (
    <Card style={styles.card}>
      <ThemedText variant="label" secondary>
        Last 7 days
      </ThemedText>
      <View style={styles.row}>
        {days.map((day) => (
          <DayCell key={day.dateKey} day={day} />
        ))}
      </View>
      <ThemedText variant="caption" secondary>
        ✅ goal met · ◐ some reading · ○ quiet day
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
});
