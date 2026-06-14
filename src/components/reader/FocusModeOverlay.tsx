import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface FocusModeOverlayProps {
  visible: boolean;
  currentPage: number;
  totalPages: number;
  onExitFocus: () => void;
}

/**
 * Minimal focus UI — hides chrome elsewhere; does not intercept PDF scroll gestures.
 */
export function FocusModeOverlay({
  visible,
  currentPage,
  totalPages,
  onExitFocus,
}: FocusModeOverlayProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View
        style={[
          styles.pagePill,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        pointerEvents="none"
      >
        <ThemedText variant="caption">
          {totalPages > 0
            ? t('reader.pageIndicator', { current: currentPage, total: totalPages })
            : t('reader.pageIndicatorShort', { current: currentPage })}
        </ThemedText>
      </View>

      <Pressable
        onPress={onExitFocus}
        style={({ pressed }) => [
          styles.exitButton,
          {
            bottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm,
            backgroundColor: colors.tint,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
        accessibilityLabel={t('focus.exit')}
      >
        <ThemedText variant="caption" style={styles.exitLabel}>
          {t('focus.exit')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  pagePill: {
    position: 'absolute',
    top: Spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  exitButton: {
    position: 'absolute',
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  exitLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
