import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import type { Book } from '@/types';
import {
  formatLastReadDate,
  formatPageProgress,
  formatReadingProgressPercent,
} from '@/utils/format';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import { PdfReaderService } from '@/services/PdfReaderService';
import { openReaderForBook } from '@/utils/readerNavigation';

interface ContinueReadingCardProps {
  book: Book;
}

export function ContinueReadingCard({ book }: ContinueReadingCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const pdfMissing = !PdfAvailabilityService.isPdfAvailable(book);
  const progressRatio = PdfReaderService.computeProgressRatio(book.currentPage, book.totalPages);
  const progressPercent = formatReadingProgressPercent(book.currentPage, book.totalPages);

  return (
    <Card style={styles.card}>
      <ThemedText variant="caption" secondary>
        {t('home.continueFromPage', { page: book.currentPage })}
      </ThemedText>
      <ThemedText variant="subtitle" numberOfLines={2}>
        {book.title}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {formatPageProgress(book.currentPage, book.totalPages)}
        {progressPercent ? ` · ${progressPercent}` : ''}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {formatLastReadDate(book.updatedAt)}
      </ThemedText>
      {pdfMissing ? (
        <ThemedText variant="caption" secondary>
          {t('pdfMissing.badge')}
        </ThemedText>
      ) : null}
      {book.totalPages > 0 ? <ProgressBar progress={progressRatio} /> : null}
      <View style={styles.actions}>
        <View style={styles.primaryAction}>
          <Button
            label={pdfMissing ? t('pdfMissing.relink') : t('common.continue')}
            onPress={() =>
              pdfMissing
                ? router.push({ pathname: '/book/[bookId]', params: { bookId: book.id } })
                : void openReaderForBook(router, book.id, t)
            }
            variant={pdfMissing ? 'secondary' : 'primary'}
          />
        </View>
        <View style={styles.secondaryAction}>
          <Button
            label={t('tabs.library')}
            onPress={() => router.push('/library')}
            variant="secondary"
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryAction: { flex: 2 },
  secondaryAction: { flex: 1 },
});
