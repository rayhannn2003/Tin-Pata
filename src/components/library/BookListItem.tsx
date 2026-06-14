import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { Book, BookAnnotationCounts } from '@/types';
import {
  formatFileSize,
  formatImportDate,
  formatLastReadDate,
  formatPageProgress,
  formatReadingProgressPercent,
  formatStatusLabel,
} from '@/utils/format';
import { PdfReaderService } from '@/services/PdfReaderService';

interface BookListItemProps {
  book: Book & BookAnnotationCounts;
  onPress: () => void;
  onMenu: () => void;
  deleting?: boolean;
}

export function BookListItem({ book, onPress, onMenu, deleting = false }: BookListItemProps) {
  const colors = useThemeColors();

  const pageLabel = formatPageProgress(book.currentPage, book.totalPages);
  const progressPercent = formatReadingProgressPercent(book.currentPage, book.totalPages);
  const progressRatio = PdfReaderService.computeProgressRatio(
    book.currentPage,
    book.totalPages,
  );

  return (
    <Card onPress={onPress} style={[styles.card, deleting && styles.deleting]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <ThemedText variant="subtitle" numberOfLines={2}>
            {book.title}
          </ThemedText>
          <ThemedText variant="caption" secondary numberOfLines={1}>
            {formatLastReadDate(book.updatedAt)}
          </ThemedText>
        </View>
        <Pressable
          onPress={onMenu}
          disabled={deleting}
          hitSlop={8}
          style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
          accessibilityLabel={`Options for ${book.title}`}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <ThemedText variant="caption">{pageLabel}</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: colors.tintMuted }]}>
          <ThemedText variant="caption" style={{ color: colors.tint }}>
            {formatStatusLabel(book.status)}
          </ThemedText>
        </View>
      </View>

      {book.totalPages > 0 ? (
        <View style={styles.progressBlock}>
          {progressPercent ? (
            <ThemedText variant="caption" secondary>
              {progressPercent}
            </ThemedText>
          ) : null}
          <ProgressBar progress={progressRatio} />
        </View>
      ) : null}

      {(book.bookmarkCount > 0 || book.noteCount > 0) ? (
        <ThemedText variant="caption" secondary>
          {book.bookmarkCount > 0
            ? `${book.bookmarkCount} ${book.bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}`
            : null}
          {book.bookmarkCount > 0 && book.noteCount > 0 ? ' · ' : null}
          {book.noteCount > 0
            ? `${book.noteCount} ${book.noteCount === 1 ? 'note' : 'notes'}`
            : null}
        </ThemedText>
      ) : null}

      <ThemedText variant="caption" secondary>
        Imported {formatImportDate(book.createdAt)} · {formatFileSize(book.fileSize)}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  deleting: { opacity: 0.6 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  titleBlock: { flex: 1, gap: Spacing.xs },
  menuButton: {
    padding: Spacing.xs,
  },
  pressed: { opacity: 0.6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBlock: { gap: 6 },
});
