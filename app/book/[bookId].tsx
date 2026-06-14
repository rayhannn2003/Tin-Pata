import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { BookActionsCard } from '@/components/book/BookActionsCard';
import { BookStatsCard } from '@/components/book/BookStatsCard';
import { RecentSessionsList } from '@/components/book/RecentSessionsList';
import { BookVisual } from '@/components/library/BookVisual';
import { BookRenameModal } from '@/components/library/BookRenameModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ThemedText } from '@/components/ui/ThemedText';
import { useBook } from '@/features/books/useBook';
import { useBookStats } from '@/features/books/useBookStats';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { BookService } from '@/services/BookService';
import {
  formatLastReadDate,
  formatPageProgress,
  formatReadingProgressPercent,
} from '@/utils/format';
import { PdfReaderService } from '@/services/PdfReaderService';

export default function BookDetailScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { book, loading: bookLoading, refresh: refreshBook } = useBook(bookId);
  const { stats, counts, loading: statsLoading, refresh: refreshStats } = useBookStats(bookId);
  const [renameVisible, setRenameVisible] = useState(false);

  const refresh = useCallback(async () => {
    await Promise.all([refreshBook(), refreshStats()]);
  }, [refreshBook, refreshStats]);

  const handleDelete = () => {
    if (!book) {
      return;
    }
    Alert.alert(t('library.deleteTitle'), t('library.deleteMessage', { title: book.title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await BookService.deleteBook(book.id);
            router.replace('/library');
          })();
        },
      },
    ]);
  };

  const handleRename = async (title: string) => {
    if (!book) {
      return;
    }
    await BookService.renameBook(book.id, title);
    setRenameVisible(false);
    await refresh();
  };

  if (bookLoading || !book) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  const progressRatio = PdfReaderService.computeProgressRatio(book.currentPage, book.totalPages);
  const progressPercent = formatReadingProgressPercent(book.currentPage, book.totalPages);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText variant="subtitle" numberOfLines={1} style={styles.topTitle}>
          {t('bookDetail.title')}
        </ThemedText>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <BookVisual title={book.title} size="lg" />
          <View style={styles.heroText}>
            <ThemedText variant="title" numberOfLines={3}>
              {book.title}
            </ThemedText>
            <ThemedText variant="caption" secondary>
              {formatLastReadDate(book.updatedAt)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="caption" secondary>
            {formatPageProgress(book.currentPage, book.totalPages)}
            {progressPercent ? ` · ${progressPercent}` : ''}
          </ThemedText>
          {book.totalPages > 0 ? (
            <ProgressBar progress={progressRatio} />
          ) : null}
          <Button
            label={t('bookDetail.continueReading')}
            onPress={() => router.push(`/reader/${book.id}`)}
          />
        </View>

        <Card muted style={styles.section}>
          <ThemedText variant="caption">
            {t('bookDetail.annotationCounts', {
              bookmarks: counts.bookmarkCount,
              notes: counts.noteCount,
            })}
          </ThemedText>
        </Card>

        {statsLoading || !stats ? (
          <View style={styles.section}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <BookStatsCard stats={stats} />
            </View>
            <View style={styles.section}>
              <RecentSessionsList sessions={stats.recentSessions} />
            </View>
          </>
        )}

        <View style={styles.section}>
          <BookActionsCard
            status={book.status}
            onRename={() => setRenameVisible(true)}
            onMarkReading={() => {
              void (async () => {
                await BookService.updateBookStatus(book.id, 'reading');
                await refresh();
              })();
            }}
            onMarkPaused={() => {
              void (async () => {
                await BookService.updateBookStatus(book.id, 'paused');
                await refresh();
              })();
            }}
            onMarkFinished={() => {
              void (async () => {
                await BookService.updateBookStatus(book.id, 'finished');
                await refresh();
              })();
            }}
            onDelete={handleDelete}
          />
        </View>
      </ScrollView>

      <BookRenameModal
        visible={renameVisible}
        initialTitle={book.title}
        onClose={() => setRenameVisible(false)}
        onSave={handleRename}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center' },
  topSpacer: { width: 24 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  hero: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  heroText: { flex: 1, gap: Spacing.xs, minWidth: 0 },
  section: {
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
