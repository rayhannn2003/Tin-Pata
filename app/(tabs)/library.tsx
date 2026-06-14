import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppEmptyState } from '@/components/common/AppEmptyState';
import { BookListItem } from '@/components/library/BookListItem';
import { BookOptionPickerModal } from '@/components/library/BookOptionPickerModal';
import { BookRenameModal } from '@/components/library/BookRenameModal';
import { LibraryFilterModal } from '@/components/library/LibraryFilterModal';
import { Button } from '@/components/ui/Button';
import { HideScreenHeader } from '@/components/ui/HideScreenHeader';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ThemedText } from '@/components/ui/ThemedText';
import { useLibrary, type LibraryBook } from '@/features/books/useLibrary';
import { BookService, BookRelinkError } from '@/services/BookService';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { openReaderForBook } from '@/utils/readerNavigation';
import {
  BOOK_CATEGORIES,
  BOOK_PRIORITIES,
  DEFAULT_LIBRARY_SORT,
  type BookCategory,
  type BookPriority,
  type LibraryCategoryFilter,
  type LibraryPriorityFilter,
  type LibrarySortOption,
  type LibraryStatusFilter,
} from '@/types/bookOrganization';
import {
  categoryLabelKey,
  hasActiveLibraryFilters,
  organizeLibraryBooks,
  sortTranslationKey,
} from '@/utils/libraryOrganize';

type PickerKind = 'category' | 'priority' | null;

export default function LibraryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [renameBook, setRenameBook] = useState<LibraryBook | null>(null);
  const [statusFilter, setStatusFilter] = useState<LibraryStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<LibraryCategoryFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<LibraryPriorityFilter>('all');
  const [sortOption, setSortOption] = useState<LibrarySortOption>(DEFAULT_LIBRARY_SORT);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [pickerBook, setPickerBook] = useState<LibraryBook | null>(null);
  const [pickerKind, setPickerKind] = useState<PickerKind>(null);

  const statusFilters = useMemo(
    (): { key: LibraryStatusFilter; label: string }[] => [
      { key: 'all', label: t('library.filterAll') },
      { key: 'reading', label: t('library.filterReading') },
      { key: 'paused', label: t('library.filterPaused') },
      { key: 'finished', label: t('library.filterFinished') },
    ],
    [t],
  );

  const {
    books,
    totalCount,
    loading,
    importing,
    deletingId,
    error,
    successMessage,
    importPdf,
    deleteBook,
    clearError,
    clearSuccess,
    refresh,
  } = useLibrary();

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = setTimeout(clearSuccess, 4000);
    return () => clearTimeout(timer);
  }, [successMessage, clearSuccess]);

  const organizeFilters = useMemo(
    () => ({
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
      search,
    }),
    [statusFilter, categoryFilter, priorityFilter, search],
  );

  const filteredBooks = useMemo(
    () => organizeLibraryBooks(books, organizeFilters, sortOption),
    [books, organizeFilters, sortOption],
  );

  const extraFilterCount =
    (categoryFilter !== 'all' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (sortOption !== DEFAULT_LIBRARY_SORT ? 1 : 0);

  const sortLabel = t(sortTranslationKey(sortOption));
  const subtitle =
    totalCount === 0
      ? t('library.intro')
      : totalCount === 1
        ? t('library.bookCountOneSorted', { sort: sortLabel })
        : t('library.bookCountSorted', { count: totalCount, sort: sortLabel });

  const handleDelete = (bookId: string, title: string) => {
    Alert.alert(t('library.deleteTitle'), t('library.deleteMessage', { title }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteBook(bookId);
        },
      },
    ]);
  };

  const handleBookMenu = (book: LibraryBook) => {
    const missingPdf = !PdfAvailabilityService.isPdfAvailable(book);
    const actions: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('library.rename'),
        onPress: () => setRenameBook(book),
      },
    ];

    if (missingPdf) {
      actions.push({
        text: t('pdfMissing.relink'),
        onPress: () => {
          void (async () => {
            try {
              const result = await BookService.relinkPdf(book.id);
              if (result) {
                await refresh();
              }
            } catch (err) {
              Alert.alert(
                t('pdfMissing.relinkFailed'),
                err instanceof BookRelinkError ? err.message : t('settings.importError'),
              );
            }
          })();
        },
      });
    }

    actions.push(
      {
        text: t('library.setCategory'),
        onPress: () => {
          setPickerBook(book);
          setPickerKind('category');
        },
      },
      {
        text: t('library.setPriority'),
        onPress: () => {
          setPickerBook(book);
          setPickerKind('priority');
        },
      },
      {
        text: t('library.markFinished'),
        onPress: () => {
          void (async () => {
            await BookService.updateBookStatus(book.id, 'finished');
            await refresh();
          })();
        },
      },
      {
        text: t('library.markReading'),
        onPress: () => {
          void (async () => {
            await BookService.updateBookStatus(book.id, 'reading');
            await refresh();
          })();
        },
      },
      {
        text: t('library.markPaused'),
        onPress: () => {
          void (async () => {
            await BookService.updateBookStatus(book.id, 'paused');
            await refresh();
          })();
        },
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => handleDelete(book.id, book.title),
      },
    );

    Alert.alert(book.title, t('library.chooseAction'), actions);
  };

  const handleRename = async (title: string) => {
    if (!renameBook) {
      return;
    }
    await BookService.renameBook(renameBook.id, title);
    setRenameBook(null);
    await refresh();
  };

  const handlePickerSelect = async (value: string) => {
    if (!pickerBook) {
      return;
    }
    if (pickerKind === 'category') {
      await BookService.updateBookCategory(pickerBook.id, value as BookCategory);
    } else if (pickerKind === 'priority') {
      await BookService.updateBookPriority(pickerBook.id, value as BookPriority);
    }
    setPickerBook(null);
    setPickerKind(null);
    await refresh();
  };

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

  const emptyTitle =
    totalCount === 0
      ? t('library.emptyTitle')
      : hasActiveLibraryFilters(organizeFilters)
        ? t('library.noMatchFilterTitle')
        : t('library.noMatchTitle');

  const emptyMessage =
    totalCount === 0
      ? t('library.emptyMessage')
      : hasActiveLibraryFilters(organizeFilters)
        ? t('library.noMatchFilterMessage')
        : t('library.noMatchMessage');

  return (
    <>
      <HideScreenHeader />
      <ScreenContainer>
        <View style={styles.header}>
          <ThemedText secondary>{subtitle}</ThemedText>
          <Button
            label={importing ? t('library.importing') : t('library.importPdf')}
            onPress={() => {
              void importPdf();
            }}
            disabled={importing || loading}
          />
        </View>

        {successMessage ? (
          <View style={[styles.banner, { backgroundColor: colors.tintMuted }]}>
            <ThemedText variant="caption" style={{ color: colors.tint }}>
              {successMessage}
            </ThemedText>
          </View>
        ) : null}

        {error ? (
          <Pressable
            onPress={clearError}
            style={[styles.banner, { backgroundColor: colors.dangerMuted }]}
          >
            <ThemedText variant="caption" style={{ color: colors.danger }}>
              {error}
            </ThemedText>
          </Pressable>
        ) : null}

        {totalCount > 0 ? (
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('library.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.search,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          />
        ) : null}

        {totalCount > 0 ? (
          <View style={styles.filterBar}>
            <View style={styles.statusFilters}>
              {statusFilters.map(({ key, label }) => {
                const active = statusFilter === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setStatusFilter(key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.tintMuted : colors.surface,
                        borderColor: active ? colors.tint : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      variant="caption"
                      style={{ color: active ? colors.tint : colors.textSecondary }}
                    >
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => setFilterModalVisible(true)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: extraFilterCount > 0 ? colors.tintMuted : colors.surface,
                  borderColor: extraFilterCount > 0 ? colors.tint : colors.border,
                },
              ]}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={extraFilterCount > 0 ? colors.tint : colors.textSecondary}
              />
              <ThemedText
                variant="caption"
                style={{ color: extraFilterCount > 0 ? colors.tint : colors.textSecondary }}
              >
                {extraFilterCount > 0
                  ? t('library.filtersActive', { count: extraFilterCount })
                  : t('library.openFilters')}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} size="large" />
            <ThemedText variant="caption" secondary>
              {t('library.loading')}
            </ThemedText>
          </View>
        ) : filteredBooks.length === 0 ? (
          <AppEmptyState
            title={emptyTitle}
            message={emptyMessage}
            actionLabel={totalCount === 0 ? t('library.importPdf') : undefined}
            onAction={totalCount === 0 ? () => void importPdf() : undefined}
          />
        ) : (
          <View style={styles.list}>
            {filteredBooks.map((book) => (
              <BookListItem
                key={book.id}
                book={book}
                onPress={() =>
                  router.push({ pathname: '/book/[bookId]', params: { bookId: book.id } })
                }
                onContinue={() => void openReaderForBook(router, book.id, t)}
                onRelink={() =>
                  router.push({ pathname: '/book/[bookId]', params: { bookId: book.id } })
                }
                onMenu={() => handleBookMenu(book)}
                deleting={deletingId === book.id}
              />
            ))}
          </View>
        )}
      </ScreenContainer>

      <BookRenameModal
        visible={renameBook !== null}
        initialTitle={renameBook?.title ?? ''}
        onClose={() => setRenameBook(null)}
        onSave={handleRename}
      />

      <LibraryFilterModal
        visible={filterModalVisible}
        sort={sortOption}
        category={categoryFilter}
        priority={priorityFilter}
        onClose={() => setFilterModalVisible(false)}
        onSortChange={setSortOption}
        onCategoryChange={setCategoryFilter}
        onPriorityChange={setPriorityFilter}
        onReset={() => {
          setCategoryFilter('all');
          setPriorityFilter('all');
          setSortOption(DEFAULT_LIBRARY_SORT);
        }}
      />

      <BookOptionPickerModal
        visible={pickerKind === 'category' && pickerBook !== null}
        title={t('library.setCategory')}
        options={categoryOptions}
        selected={pickerBook?.category ?? 'general'}
        onSelect={handlePickerSelect}
        onClose={() => {
          setPickerBook(null);
          setPickerKind(null);
        }}
      />

      <BookOptionPickerModal
        visible={pickerKind === 'priority' && pickerBook !== null}
        title={t('library.setPriority')}
        options={priorityOptions}
        selected={pickerBook?.priority ?? 'normal'}
        onSelect={handlePickerSelect}
        onClose={() => {
          setPickerBook(null);
          setPickerKind(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.md, marginBottom: Spacing.lg },
  banner: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: Spacing.md,
  },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  filterBar: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  list: { gap: Spacing.md, paddingBottom: Spacing.sm },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
