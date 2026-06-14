import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface LastReadBannerProps {
  message: string;
  hint?: string;
  actionLabel: string;
  onGoToPage: () => void;
  onDismiss: () => void;
}

/**
 * Manual resume fallback — only jumps when the user taps the action button.
 */
export function LastReadBanner({
  message,
  hint,
  actionLabel,
  onGoToPage,
  onDismiss,
}: LastReadBannerProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.tintMuted }]}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <ThemedText variant="caption" style={{ color: colors.tint }}>
            {message}
          </ThemedText>
          {hint ? (
            <ThemedText variant="caption" secondary>
              {hint}
            </ThemedText>
          ) : null}
        </View>
        <Pressable
          onPress={onGoToPage}
          style={({ pressed }) => [
            styles.action,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <ThemedText variant="caption" style={styles.actionLabel}>
            {actionLabel}
          </ThemedText>
        </Pressable>
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismiss}>
          <ThemedText variant="caption" secondary>
            ✕
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  action: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dismiss: {
    padding: Spacing.xs,
  },
});
