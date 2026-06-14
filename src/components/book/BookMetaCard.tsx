import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { Book, BookStatus } from '@/types';
import {
  formatLastReadDate,
  formatPageProgress,
  formatReadingProgressPercent,
} from '@/utils/format';
import { categoryLabelKey, statusTranslationKey } from '@/utils/libraryOrganize';
import { PdfReaderService } from '@/services/PdfReaderService';

interface BookMetaCardProps {
  book: Book;
  onEditCategory: () => void;
  onEditPriority: () => void;
  onEditStatus: () => void;
}

function MetaRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const content = (
    <View style={styles.row}>
      <ThemedText variant="caption" secondary>
        {label}
      </ThemedText>
      <View style={styles.valueBlock}>
        <ThemedText variant="caption">{value}</ThemedText>
        {onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

function statusLabel(t: (key: string) => string, status: BookStatus): string {
  return t(statusTranslationKey(status));
}

export function BookMetaCard({
  book,
  onEditCategory,
  onEditPriority,
  onEditStatus,
}: BookMetaCardProps) {
  const { t } = useTranslation();
  const progressRatio = PdfReaderService.computeProgressRatio(book.currentPage, book.totalPages);
  const progressPercent = formatReadingProgressPercent(book.currentPage, book.totalPages);

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('bookDetail.metaTitle')}</ThemedText>

      <MetaRow
        label={t('bookDetail.category')}
        value={t(categoryLabelKey(book.category))}
        onPress={onEditCategory}
      />
      <MetaRow
        label={t('bookDetail.priority')}
        value={t(`library.priority.${book.priority}`)}
        onPress={onEditPriority}
      />
      <MetaRow
        label={t('bookDetail.status')}
        value={statusLabel(t, book.status)}
        onPress={onEditStatus}
      />
      <MetaRow
        label={t('bookDetail.progress')}
        value={
          progressPercent
            ? `${formatPageProgress(book.currentPage, book.totalPages)} · ${progressPercent}`
            : formatPageProgress(book.currentPage, book.totalPages)
        }
      />
      {book.totalPages > 0 ? <ProgressBar progress={progressRatio} /> : null}
      <MetaRow
        label={t('bookDetail.lastRead')}
        value={formatLastReadDate(book.updatedAt)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  valueBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  pressed: { opacity: 0.7 },
});
