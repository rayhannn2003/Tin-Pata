import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { Note } from '@/types';

interface NotesListModalProps {
  visible: boolean;
  notes: Note[];
  currentPage: number;
  onClose: () => void;
  onSelectPage: (page: number) => void;
  onEditPage: (page: number) => void;
  onDelete: (id: string) => void;
}

export function NotesListModal({
  visible,
  notes,
  currentPage,
  onClose,
  onSelectPage,
  onEditPage,
  onDelete,
}: NotesListModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ThemedText variant="subtitle">{t('reader.notesTitle')}</ThemedText>
          <ThemedText variant="caption" secondary>
            {t('reader.notesTapHint')}
          </ThemedText>

          {notes.length === 0 ? (
            <ThemedText variant="caption" secondary style={styles.empty}>
              {t('reader.noNotesYetLong')}
            </ThemedText>
          ) : (
            <FlatList
              data={notes}
              keyExtractor={(item) => item.id}
              style={styles.list}
              renderItem={({ item }) => {
                const isCurrent = item.pageNumber === currentPage;
                return (
                  <View
                    style={[
                      styles.row,
                      { borderColor: colors.border },
                      isCurrent && { backgroundColor: colors.tintMuted },
                    ]}
                  >
                    <Pressable
                      style={styles.rowMain}
                      onPress={() => {
                        onSelectPage(item.pageNumber);
                        onClose();
                      }}
                    >
                      <ThemedText variant="caption" secondary>
                        {t('reader.page')} {item.pageNumber}
                      </ThemedText>
                      <ThemedText numberOfLines={3}>{item.noteText}</ThemedText>
                    </Pressable>
                    <View style={styles.rowActions}>
                      <Pressable
                        onPress={() => {
                          onEditPage(item.pageNumber);
                        }}
                        hitSlop={8}
                        accessibilityLabel={`Edit note on page ${item.pageNumber}`}
                      >
                        <Ionicons name="create-outline" size={18} color={colors.tint} />
                      </Pressable>
                      <Pressable
                        onPress={() => onDelete(item.id)}
                        hitSlop={8}
                        accessibilityLabel={`Delete note on page ${item.pageNumber}`}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                );
              }}
            />
          )}

          <Button label={t('common.close')} onPress={onClose} variant="secondary" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
    maxHeight: '70%',
  },
  list: { maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    gap: 8,
  },
  rowMain: { flex: 1, gap: 4 },
  rowActions: { flexDirection: 'row', gap: 12, paddingTop: 2 },
  empty: { paddingVertical: 12 },
});
