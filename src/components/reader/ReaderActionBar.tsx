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
  onPress: () => void;
  onLongPress?: () => void;
}

function ActionButton({ icon, label, active = false, onPress, onLongPress }: ActionButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
      accessibilityLabel={label}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? colors.tint : colors.textSecondary}
      />
      <ThemedText
        variant="caption"
        style={{ color: active ? colors.tint : colors.textSecondary, fontSize: 10 }}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function ReaderActionBar({
  isBookmarked,
  hasPageNote,
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
        onPress={onBookmark}
      />
      <ActionButton
        icon={hasPageNote ? 'document-text' : 'document-text-outline'}
        label={t('reader.note')}
        active={hasPageNote}
        onPress={onNotes}
      />
      <ActionButton icon="list-outline" label={t('reader.lists')} onPress={onOpenLists} />
      <ActionButton icon="navigate-outline" label={t('reader.page')} onPress={onGoToPage} />
      <Pressable
        onPress={onFinish}
        style={({ pressed }) => [
          styles.finishButton,
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
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.xs,
  },
  finishButton: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 64,
    alignItems: 'center',
  },
  finishLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pressed: { opacity: 0.7 },
});
