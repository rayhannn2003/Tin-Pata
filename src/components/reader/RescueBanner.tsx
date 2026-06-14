import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface RescueBannerProps {
  message: string;
  completed?: boolean;
}

export function RescueBanner({ message, completed = false }: RescueBannerProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: completed ? colors.tintMuted : colors.surface,
          borderColor: colors.tint,
        },
      ]}
    >
      <ThemedText variant="caption" style={{ color: colors.tint }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
