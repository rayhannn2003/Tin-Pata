import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';
import { formatDurationSeconds } from '@/utils/date';

interface ReadingTimerProps {
  elapsedSeconds: number;
  isPaused?: boolean;
}

export function ReadingTimer({ elapsedSeconds, isPaused = false }: ReadingTimerProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.tintMuted }]}>
      <ThemedText variant="caption" style={{ color: colors.tint }}>
        {formatDurationSeconds(elapsedSeconds)}
      </ThemedText>
      {isPaused ? (
        <ThemedText variant="caption" secondary style={styles.paused}>
          Paused
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  paused: {
    fontSize: 11,
  },
});
