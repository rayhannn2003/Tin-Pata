import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { Bookmark, BookmarkWithBook } from '@/types';
import { formatImportDate } from '@/utils/format';

interface BookmarkListItemProps {
  bookmark: Bookmark | BookmarkWithBook;
  showBookTitle?: boolean;
  onPress: () => void;
}

function hasBookTitle(bookmark: Bookmark | BookmarkWithBook): bookmark is BookmarkWithBook {
  return 'bookTitle' in bookmark && typeof bookmark.bookTitle === 'string';
}

export const BookmarkListItem = memo(function BookmarkListItem({
  bookmark,
  showBookTitle = true,
  onPress,
}: BookmarkListItemProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const dateLabel = formatImportDate(bookmark.createdAt);
  const title =
    bookmark.title?.trim() || t('annotations.page', { page: bookmark.pageNumber });

  return (
    <Card style={styles.card}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.press, pressed && styles.pressed]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            {showBookTitle && hasBookTitle(bookmark) ? (
              <ThemedText variant="subtitle" numberOfLines={1}>
                {bookmark.bookTitle}
              </ThemedText>
            ) : null}
            <ThemedText variant="caption" secondary>
              {t('annotations.page', { page: bookmark.pageNumber })}
              {' · '}
              {dateLabel}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </View>
        <ThemedText numberOfLines={2}>{title}</ThemedText>
        <ThemedText variant="caption" style={{ color: colors.tint }}>
          {t('annotations.openPage', { page: bookmark.pageNumber })}
        </ThemedText>
      </Pressable>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { padding: 0 },
  press: { padding: Spacing.md, gap: Spacing.sm },
  pressed: { opacity: 0.85 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
});
