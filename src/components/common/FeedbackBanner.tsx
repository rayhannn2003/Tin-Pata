import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface FeedbackBannerProps {
  message: string;
  variant?: 'success' | 'info' | 'error';
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export function FeedbackBanner({
  message,
  variant = 'info',
  onDismiss,
  autoDismissMs = 3000,
}: FeedbackBannerProps) {
  const colors = useThemeColors();

  useEffect(() => {
    if (!onDismiss || autoDismissMs <= 0) {
      return;
    }
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, message, onDismiss]);

  const backgroundColor =
    variant === 'success'
      ? colors.tintMuted
      : variant === 'error'
        ? colors.dangerMuted
        : colors.tintMuted;

  const textColor =
    variant === 'success' ? colors.tint : variant === 'error' ? colors.danger : colors.tint;

  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <ThemedText variant="caption" style={{ color: textColor }}>
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
  },
});
