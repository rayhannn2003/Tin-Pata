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
import type { Bookmark } from '@/types';

interface BookmarkListModalProps {
  visible: boolean;
  bookmarks: Bookmark[];
  currentPage: number;
  onClose: () => void;
  onSelectPage: (page: number) => void;
  onDelete: (id: string) => void;
}

export function BookmarkListModal({
  visible,
  bookmarks,
  currentPage,
  onClose,
  onSelectPage,
  onDelete,
}: BookmarkListModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ThemedText variant="subtitle">{t('reader.bookmarksTitle')}</ThemedText>
          <ThemedText variant="caption" secondary>
            {t('reader.bookmarksTapHint')}
          </ThemedText>

          {bookmarks.length === 0 ? (
            <ThemedText variant="caption" secondary style={styles.empty}>
              {t('reader.noBookmarks')}
            </ThemedText>
          ) : (
            <FlatList
              data={bookmarks}
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
                      <ThemedText variant="subtitle">
                        {t('reader.page')} {item.pageNumber}
                      </ThemedText>
                      {item.title ? (
                        <ThemedText variant="caption" secondary numberOfLines={1}>
                          {item.title}
                        </ThemedText>
                      ) : null}
                    </Pressable>
                    <Pressable
                      onPress={() => onDelete(item.id)}
                      hitSlop={8}
                      accessibilityLabel={`Remove bookmark on page ${item.pageNumber}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                    </Pressable>
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
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    gap: 8,
  },
  rowMain: { flex: 1, gap: 2 },
  empty: { paddingVertical: 12 },
});
