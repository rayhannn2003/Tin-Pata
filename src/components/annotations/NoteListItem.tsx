import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { Note, NoteWithBook } from '@/types';
import { formatImportDate } from '@/utils/format';
import { truncatePreview } from '@/utils/readerNavigation';

interface NoteListItemProps {
  note: Note | NoteWithBook;
  showBookTitle?: boolean;
  onPress: () => void;
}

function hasBookTitle(note: Note | NoteWithBook): note is NoteWithBook {
  return 'bookTitle' in note && typeof note.bookTitle === 'string';
}

export const NoteListItem = memo(function NoteListItem({
  note,
  showBookTitle = true,
  onPress,
}: NoteListItemProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dateLabel = formatImportDate(note.updatedAt || note.createdAt);

  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            {showBookTitle && hasBookTitle(note) ? (
              <ThemedText variant="subtitle" numberOfLines={1}>
                {note.bookTitle}
              </ThemedText>
            ) : null}
            <ThemedText variant="caption" secondary>
              {t('annotations.page', { page: note.pageNumber })}
              {' · '}
              {dateLabel}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
        <ThemedText numberOfLines={3}>{truncatePreview(note.noteText)}</ThemedText>
        <ThemedText variant="caption" style={{ color: colors.tint }}>
          {t('annotations.openPage', { page: note.pageNumber })}
        </ThemedText>
      </Pressable>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { padding: 0 },
  press: { padding: Spacing.md, gap: Spacing.sm },
  pressed: { opacity: 0.85 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
});
