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

import { AppEmptyState } from '@/components/common/AppEmptyState';
import { BookListItem } from '@/components/library/BookListItem';
import { BookRenameModal } from '@/components/library/BookRenameModal';
import { Button } from '@/components/ui/Button';
import { HideScreenHeader } from '@/components/ui/HideScreenHeader';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ThemedText } from '@/components/ui/ThemedText';
import { useLibrary, type LibraryFilter } from '@/features/books/useLibrary';
import { BookService } from '@/services/BookService';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { LibraryBook } from '@/features/books/useLibrary';

export default function LibraryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [renameBook, setRenameBook] = useState<LibraryBook | null>(null);

  const filters = useMemo(
    (): { key: LibraryFilter; label: string }[] => [
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
    filter,
    setFilter,
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

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return books;
    }
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.fileName.toLowerCase().includes(query),
    );
  }, [books, search]);

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
      ],
    );
  };

  const handleBookMenu = (book: LibraryBook) => {
    Alert.alert(book.title, t('library.chooseAction'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('library.rename'),
        onPress: () => setRenameBook(book),
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
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => handleDelete(book.id, book.title),
      },
    ]);
  };

  const handleRename = async (title: string) => {
    if (!renameBook) {
      return;
    }
    await BookService.renameBook(renameBook.id, title);
    setRenameBook(null);
    await refresh();
  };

  return (
    <>
      <HideScreenHeader />
      <ScreenContainer>
        <View style={styles.header}>
          <ThemedText secondary>
            {totalCount === 0
              ? t('library.intro')
              : totalCount === 1
                ? t('library.bookCountOne')
                : t('library.bookCount', { count: totalCount })}
          </ThemedText>
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

        <View style={styles.filters}>
          {filters.map(({ key, label }) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
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

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} size="large" />
            <ThemedText variant="caption" secondary>
              {t('library.loading')}
            </ThemedText>
          </View>
        ) : filteredBooks.length === 0 ? (
          <AppEmptyState
            title={totalCount === 0 ? t('library.emptyTitle') : t('library.noMatchTitle')}
            message={totalCount === 0 ? t('library.emptyMessage') : t('library.noMatchMessage')}
            actionLabel={totalCount === 0 ? t('library.importPdf') : undefined}
            onAction={totalCount === 0 ? () => void importPdf() : undefined}
          />
        ) : (
          <View style={styles.list}>
            {filteredBooks.map((book) => (
              <BookListItem
                key={book.id}
                book={book}
                onPress={() => router.push(`/reader/${book.id}`)}
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
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
