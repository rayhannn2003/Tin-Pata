import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface ReaderActionBarProps {
  isBookmarked: boolean;
  hasPageNote: boolean;
  compact?: boolean;
  onBookmark: () => void;
  onNotes: () => void;
  onOpenLists: () => void;
  onGoToPage: () => void;
  onFinish: () => void;
}

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  compact?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

function ActionButton({
  icon,
  label,
  active = false,
  compact = false,
  onPress,
  onLongPress,
}: ActionButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.action,
        compact && styles.actionCompact,
        pressed && styles.pressed,
      ]}
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={compact ? 20 : 22}
        color={active ? colors.tint : colors.textSecondary}
      />
      {!compact ? (
        <ThemedText
          variant="caption"
          style={{ color: active ? colors.tint : colors.textSecondary, fontSize: 10 }}
          numberOfLines={1}
        >
          {label}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export function ReaderActionBar({
  isBookmarked,
  hasPageNote,
  compact = false,
  onBookmark,
  onNotes,
  onOpenLists,
  onGoToPage,
  onFinish,
}: ReaderActionBarProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
        },
      ]}
    >
      <ActionButton
        icon={isBookmarked ? 'bookmark' : 'bookmark-outline'}
        label={t('reader.bookmark')}
        active={isBookmarked}
        compact={compact}
        onPress={onBookmark}
      />
      <ActionButton
        icon={hasPageNote ? 'document-text' : 'document-text-outline'}
        label={t('reader.note')}
        active={hasPageNote}
        compact={compact}
        onPress={onNotes}
      />
      <ActionButton
        icon="list-outline"
        label={t('reader.lists')}
        compact={compact}
        onPress={onOpenLists}
      />
      <ActionButton
        icon="navigate-outline"
        label={t('reader.page')}
        compact={compact}
        onPress={onGoToPage}
      />
      <Pressable
        onPress={onFinish}
        style={({ pressed }) => [
          styles.finishButton,
          compact && styles.finishButtonCompact,
          { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityLabel={t('reader.finishSession')}
      >
        <ThemedText variant="caption" style={styles.finishLabel}>
          {t('reader.finish')}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  containerCompact: {
    paddingTop: Spacing.xs,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  actionCompact: {
    paddingVertical: 2,
  },
  finishButton: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 64,
    alignItems: 'center',
  },
  finishButtonCompact: {
    minWidth: 52,
    paddingHorizontal: Spacing.sm,
  },
  finishLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pressed: { opacity: 0.7 },
});
