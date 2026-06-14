import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  const colors = useThemeColors();
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <ThemedText variant="caption" secondary style={styles.label}>
          {label}
        </ThemedText>
      ) : null}
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: colors.tint, width: `${clamped * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { marginBottom: 2 },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
