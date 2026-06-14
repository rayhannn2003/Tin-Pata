import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BookmarkListItem } from '@/components/annotations/BookmarkListItem';
import { NoteListItem } from '@/components/annotations/NoteListItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import type { Bookmark } from '@/types';
import type { Note } from '@/types';

interface BookRecentNotesCardProps {
  notes: Note[];
  loading: boolean;
  onOpenAll: () => void;
  onOpenNote: (note: Note) => void;
}

export function BookRecentNotesCard({
  notes,
  loading,
  onOpenAll,
  onOpenNote,
}: BookRecentNotesCardProps) {
  const { t } = useTranslation();
  const recent = [...notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText variant="subtitle">{t('annotations.notes')}</ThemedText>
        {notes.length > 0 ? (
          <Button
            label={t('annotations.viewAllNotes')}
            onPress={onOpenAll}
            variant="secondary"
          />
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : recent.length === 0 ? (
        <ThemedText variant="caption" secondary>
          {t('annotations.noNotesYet')}
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {recent.map((note) => (
            <NoteListItem
              key={note.id}
              note={note}
              showBookTitle={false}
              onPress={() => onOpenNote(note)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

interface BookRecentBookmarksCardProps {
  bookmarks: Bookmark[];
  loading: boolean;
  onOpenAll: () => void;
  onOpenBookmark: (bookmark: Bookmark) => void;
}

export function BookRecentBookmarksCard({
  bookmarks,
  loading,
  onOpenAll,
  onOpenBookmark,
}: BookRecentBookmarksCardProps) {
  const { t } = useTranslation();
  const recent = [...bookmarks]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText variant="subtitle">{t('annotations.bookmarks')}</ThemedText>
        {bookmarks.length > 0 ? (
          <Button
            label={t('annotations.viewAllBookmarks')}
            onPress={onOpenAll}
            variant="secondary"
          />
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} />
      ) : recent.length === 0 ? (
        <ThemedText variant="caption" secondary>
          {t('annotations.noBookmarksYet')}
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {recent.map((bookmark) => (
            <BookmarkListItem
              key={bookmark.id}
              bookmark={bookmark}
              showBookTitle={false}
              onPress={() => onOpenBookmark(bookmark)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  list: { gap: Spacing.sm },
  loader: { paddingVertical: Spacing.sm },
});
