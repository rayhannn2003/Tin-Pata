import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ReadingTimer } from '@/components/reader/ReadingTimer';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { formatPageProgress } from '@/utils/format';

interface PdfReaderToolbarProps {
  title: string;
  currentPage: number;
  totalPages: number;
  elapsedSeconds: number;
  timerPaused?: boolean;
  showTimer?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  onBack: () => void;
}

export function PdfReaderToolbar({
  title,
  currentPage,
  totalPages,
  elapsedSeconds,
  timerPaused = false,
  showTimer = true,
  showProgress = true,
  compact = false,
  onBack,
}: PdfReaderToolbarProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        compact && styles.compact,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityLabel={t('common.goBack')}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.titleBlock}>
          <ThemedText variant="subtitle" numberOfLines={1}>
            {title}
          </ThemedText>
          {showProgress ? (
            <ThemedText variant="caption" secondary>
              {formatPageProgress(currentPage, totalPages)}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {showTimer ? (
        <View style={styles.timerRow}>
          <ReadingTimer elapsedSeconds={elapsedSeconds} isPaused={timerPaused} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compact: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timerRow: {
    paddingLeft: 36,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  pressed: { opacity: 0.7 },
});
