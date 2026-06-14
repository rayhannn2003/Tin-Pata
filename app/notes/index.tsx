import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { AppEmptyState } from '@/components/common/AppEmptyState';
import { NoteListItem } from '@/components/annotations/NoteListItem';
import { ThemedText } from '@/components/ui/ThemedText';
import { useAllNotes } from '@/features/notes/useAllNotes';
import { useBook } from '@/features/books/useBook';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { openReaderAtPage } from '@/utils/readerNavigation';

export default function NotesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const [search, setSearch] = useState('');
  const { notes, loading } = useAllNotes(search, bookId);
  const { book } = useBook(bookId);

  const title = useMemo(() => {
    if (bookId && book) {
      return t('annotations.notesForBook', { title: book.title });
    }
    return t('annotations.notes');
  }, [book, bookId, t]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText variant="subtitle" numberOfLines={1} style={styles.topTitle}>
          {title}
        </ThemedText>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.content}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('annotations.searchNotes')}
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

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} size="large" />
          </View>
        ) : notes.length === 0 ? (
          <AppEmptyState
            title={t('annotations.noNotesFound')}
            message={
              search.trim()
                ? t('annotations.noNotesMatch')
                : t('annotations.noNotesYet')
            }
          />
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <NoteListItem
                note={item}
                showBookTitle={!bookId}
                onPress={() => {
                  void openReaderAtPage(router, item.bookId, item.pageNumber);
                }}
              />
            )}
          />
        )}
      </View>
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
  content: { flex: 1, padding: Spacing.md, gap: Spacing.md },
  search: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: { gap: Spacing.md, paddingBottom: Spacing.lg },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
