import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { BookMissingPdfCard } from '@/components/book/BookMissingPdfCard';
import { BookPdfCloudCard } from '@/components/book/BookPdfCloudCard';
import { BookAnalyticsCard } from '@/components/book/BookAnalyticsCard';
import { BookActionsCard } from '@/components/book/BookActionsCard';
import {
  BookRecentBookmarksCard,
  BookRecentNotesCard,
} from '@/components/book/BookAnnotationsSection';
import { BookMetaCard } from '@/components/book/BookMetaCard';
import { BookStatsCard } from '@/components/book/BookStatsCard';
import { RecentSessionsList } from '@/components/book/RecentSessionsList';
import { BookVisual } from '@/components/library/BookVisual';
import { BookOptionPickerModal } from '@/components/library/BookOptionPickerModal';
import { BookRenameModal } from '@/components/library/BookRenameModal';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useBook } from '@/features/books/useBook';
import { useBookStats } from '@/features/books/useBookStats';
import { useBookmarks } from '@/features/bookmarks/useBookmarks';
import { useBookNotes } from '@/features/notes/useBookNotes';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { BookService, BookRelinkError } from '@/services/BookService';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import {
  BOOK_CATEGORIES,
  BOOK_PRIORITIES,
  type BookCategory,
  type BookPriority,
} from '@/types/bookOrganization';
import type { BookStatus } from '@/types';
import { categoryLabelKey } from '@/utils/libraryOrganize';
import { formatLastReadDate } from '@/utils/format';
import { confirmBookDelete } from '@/utils/confirmBookDelete';
import { openReaderAtPage } from '@/utils/readerNavigation';

export default function BookDetailScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { book, loading: bookLoading, refresh: refreshBook } = useBook(bookId);
  const { stats, loading: statsLoading, refresh: refreshStats } = useBookStats(bookId);
  const { notes, loading: notesLoading } = useBookNotes(bookId);
  const { bookmarks, loading: bookmarksLoading } = useBookmarks(bookId);
  const [renameVisible, setRenameVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [priorityPickerVisible, setPriorityPickerVisible] = useState(false);
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [relinking, setRelinking] = useState(false);
  const [relinkMessage, setRelinkMessage] = useState<string | null>(null);
  const [relinkError, setRelinkError] = useState<string | null>(null);

  const pdfMissing = book ? !PdfAvailabilityService.isPdfAvailable(book) : false;
  const cloudPdfAvailable = Boolean(book?.pdfCloudAvailable && book?.cloudStoragePath);

  const categoryOptions = useMemo(
    () =>
      BOOK_CATEGORIES.map((value) => ({
        value,
        label: t(categoryLabelKey(value)),
      })),
    [t],
  );

  const priorityOptions = useMemo(
    () =>
      BOOK_PRIORITIES.map((value) => ({
        value,
        label: t(`library.priority.${value}`),
      })),
    [t],
  );

  const statusOptions = useMemo(
    (): { value: BookStatus; label: string }[] => [
      { value: 'not_started', label: t('bookDetail.statusNotStarted') },
      { value: 'reading', label: t('library.filterReading') },
      { value: 'paused', label: t('library.filterPaused') },
      { value: 'finished', label: t('library.filterFinished') },
    ],
    [t],
  );

  const refresh = useCallback(async () => {
    await Promise.all([refreshBook(), refreshStats()]);
  }, [refreshBook, refreshStats]);

  const handleRelink = useCallback(async () => {
    if (!book) {
      return;
    }
    try {
      setRelinking(true);
      setRelinkError(null);
      setRelinkMessage(null);
      const result = await BookService.relinkPdf(book.id);
      if (!result) {
        return;
      }
      if (result.pageAdjusted) {
        setRelinkMessage(t('pdfMissing.pageAdjusted'));
      } else {
        setRelinkMessage(t('pdfMissing.relinkSuccess'));
      }
      await refresh();
    } catch (err) {
      setRelinkError(
        err instanceof BookRelinkError ? err.message : t('pdfMissing.relinkFailed'),
      );
    } finally {
      setRelinking(false);
    }
  }, [book, refresh, t]);

  const handleOpenReader = useCallback(() => {
    if (!book) {
      return;
    }
    if (pdfMissing && !cloudPdfAvailable) {
      void handleRelink();
      return;
    }
    if (pdfMissing && cloudPdfAvailable) {
      return;
    }
    router.push(`/reader/${book.id}`);
  }, [book, cloudPdfAvailable, handleRelink, pdfMissing, router]);

  const handleOpenAnnotation = useCallback(
    (pageNumber: number) => {
      if (!book) {
        return;
      }
      if (pdfMissing) {
        void handleRelink();
        return;
      }
      void openReaderAtPage(router, book.id, pageNumber, t);
    },
    [book, handleRelink, pdfMissing, router, t],
  );

  const handleDelete = () => {
    if (!book) {
      return;
    }
    confirmBookDelete(book.id, book.title, t, async () => {
      await BookService.deleteBook(book.id);
      router.replace('/library');
    });
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
          <BookMetaCard
            book={book}
            onEditCategory={() => setCategoryPickerVisible(true)}
            onEditPriority={() => setPriorityPickerVisible(true)}
            onEditStatus={() => setStatusPickerVisible(true)}
          />
          {pdfMissing && !cloudPdfAvailable ? (
            <BookMissingPdfCard
              relinking={relinking}
              onRelink={() => void handleRelink()}
              onKeepMetadata={() => setRelinkMessage(t('pdfMissing.progressPreserved'))}
            />
          ) : !pdfMissing ? (
            <Button
              label={t('bookDetail.continueReading')}
              onPress={handleOpenReader}
            />
          ) : null}
          <BookPdfCloudCard
            book={book}
            onChanged={refresh}
            onRelink={() => void handleRelink()}
          />
          {relinkMessage ? (
            <ThemedText variant="caption" style={{ color: colors.tint }}>
              {relinkMessage}
            </ThemedText>
          ) : null}
          {relinkError ? (
            <ThemedText variant="caption" style={{ color: colors.danger }}>
              {relinkError}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.section}>
          <BookRecentNotesCard
            notes={notes}
            loading={notesLoading}
            onOpenAll={() =>
              router.push({ pathname: '/notes', params: { bookId: book.id } })
            }
            onOpenNote={(note) => {
              void handleOpenAnnotation(note.pageNumber);
            }}
          />
        </View>

        <View style={styles.section}>
          <BookRecentBookmarksCard
            bookmarks={bookmarks}
            loading={bookmarksLoading}
            onOpenAll={() =>
              router.push({ pathname: '/bookmarks', params: { bookId: book.id } })
            }
            onOpenBookmark={(bookmark) => {
              void handleOpenAnnotation(bookmark.pageNumber);
            }}
          />
        </View>

        {statsLoading || !stats ? (
          <View style={styles.section}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <BookAnalyticsCard stats={stats} />
            </View>
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

      <BookOptionPickerModal
        visible={categoryPickerVisible}
        title={t('bookDetail.editCategory')}
        options={categoryOptions}
        selected={book.category}
        onSelect={(value) => {
          void (async () => {
            await BookService.updateBookCategory(book.id, value as BookCategory);
            setCategoryPickerVisible(false);
            await refresh();
          })();
        }}
        onClose={() => setCategoryPickerVisible(false)}
      />

      <BookOptionPickerModal
        visible={priorityPickerVisible}
        title={t('bookDetail.editPriority')}
        options={priorityOptions}
        selected={book.priority}
        onSelect={(value) => {
          void (async () => {
            await BookService.updateBookPriority(book.id, value as BookPriority);
            setPriorityPickerVisible(false);
            await refresh();
          })();
        }}
        onClose={() => setPriorityPickerVisible(false)}
      />

      <BookOptionPickerModal
        visible={statusPickerVisible}
        title={t('bookDetail.editStatus')}
        options={statusOptions}
        selected={book.status}
        onSelect={(value) => {
          void (async () => {
            await BookService.updateBookStatus(book.id, value as BookStatus);
            setStatusPickerVisible(false);
            await refresh();
          })();
        }}
        onClose={() => setStatusPickerVisible(false)}
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
