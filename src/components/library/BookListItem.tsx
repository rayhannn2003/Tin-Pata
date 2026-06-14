import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookVisual } from '@/components/library/BookVisual';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { Book, BookAnnotationCounts, BookStatus } from '@/types';
import {
  formatLastReadDate,
  formatPageProgress,
  formatReadingProgressPercent,
} from '@/utils/format';
import { PdfReaderService } from '@/services/PdfReaderService';

interface BookListItemProps {
  book: Book & BookAnnotationCounts;
  onPress: () => void;
  onContinue: () => void;
  onMenu: () => void;
  deleting?: boolean;
}

function statusKey(status: BookStatus): string {
  switch (status) {
    case 'reading':
      return 'library.filterReading';
    case 'paused':
      return 'library.filterPaused';
    case 'finished':
      return 'library.filterFinished';
    default:
      return 'bookDetail.statusNotStarted';
  }
}

export function BookListItem({
  book,
  onPress,
  onContinue,
  onMenu,
  deleting = false,
}: BookListItemProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const pageLabel = formatPageProgress(book.currentPage, book.totalPages);
  const progressPercent = formatReadingProgressPercent(book.currentPage, book.totalPages);
  const progressRatio = PdfReaderService.computeProgressRatio(
    book.currentPage,
    book.totalPages,
  );

  return (
    <Card style={[styles.card, deleting && styles.deleting]}>
      <Pressable onPress={onPress} style={styles.mainPress}>
        <View style={styles.header}>
          <BookVisual title={book.title} size="md" />
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
            accessibilityLabel={t('library.chooseAction')}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <ThemedText variant="caption">{pageLabel}</ThemedText>
          <View style={[styles.statusBadge, { backgroundColor: colors.tintMuted }]}>
            <ThemedText variant="caption" style={{ color: colors.tint }}>
              {t(statusKey(book.status))}
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
              ? t('library.bookmarkCount', { count: book.bookmarkCount })
              : null}
            {book.bookmarkCount > 0 && book.noteCount > 0 ? ' · ' : null}
            {book.noteCount > 0 ? t('library.noteCount', { count: book.noteCount }) : null}
          </ThemedText>
        ) : null}
      </Pressable>

      <View style={styles.actions}>
        <Button
          label={t('home.continueReading')}
          onPress={onContinue}
          disabled={deleting}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  deleting: { opacity: 0.6 },
  mainPress: { gap: Spacing.sm },
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
  actions: { marginTop: Spacing.xs },
});
