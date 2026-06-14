import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface ReaderListsModalProps {
  visible: boolean;
  bookmarkCount: number;
  noteCount: number;
  onClose: () => void;
  onOpenBookmarks: () => void;
  onOpenNotes: () => void;
}

export function ReaderListsModal({
  visible,
  bookmarkCount,
  noteCount,
  onClose,
  onOpenBookmarks,
  onOpenNotes,
}: ReaderListsModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ThemedText variant="subtitle">{t('reader.listsTitle')}</ThemedText>
          <ThemedText variant="caption" secondary>
            {t('reader.listsSubtitle')}
          </ThemedText>

          <Pressable
            onPress={() => {
              onClose();
              onOpenBookmarks();
            }}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <ThemedText style={styles.optionLabel}>{t('reader.bookmarksTitle')}</ThemedText>
            <ThemedText variant="caption" secondary>
              {t('reader.savedCount', { count: bookmarkCount })}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              onOpenNotes();
            }}
            style={({ pressed }) => [
              styles.option,
              { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <ThemedText style={styles.optionLabel}>{t('reader.notesTitle')}</ThemedText>
            <ThemedText variant="caption" secondary>
              {t('reader.savedCount', { count: noteCount })}
            </ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  optionLabel: { fontWeight: '600', fontSize: 16 },
});
