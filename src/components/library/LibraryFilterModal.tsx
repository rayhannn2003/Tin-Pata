import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n/useTranslation';
import {
  BOOK_CATEGORIES,
  BOOK_PRIORITIES,
  LIBRARY_SORT_OPTIONS,
  type BookCategory,
  type BookPriority,
  type LibraryCategoryFilter,
  type LibraryPriorityFilter,
  type LibrarySortOption,
} from '@/types/bookOrganization';
import { categoryLabelKey, sortTranslationKey } from '@/utils/libraryOrganize';

interface LibraryFilterModalProps {
  visible: boolean;
  sort: LibrarySortOption;
  category: LibraryCategoryFilter;
  priority: LibraryPriorityFilter;
  onClose: () => void;
  onSortChange: (sort: LibrarySortOption) => void;
  onCategoryChange: (category: LibraryCategoryFilter) => void;
  onPriorityChange: (priority: LibraryPriorityFilter) => void;
  onReset: () => void;
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.tintMuted : colors.surface,
          borderColor: active ? colors.tint : colors.border,
        },
      ]}
    >
      <ThemedText variant="caption" style={{ color: active ? colors.tint : colors.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function LibraryFilterModal({
  visible,
  sort,
  category,
  priority,
  onClose,
  onSortChange,
  onCategoryChange,
  onPriorityChange,
  onReset,
}: LibraryFilterModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ThemedText variant="subtitle">{t('library.filterSortTitle')}</ThemedText>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <ThemedText variant="caption" secondary>
                {t('library.sortLabel')}
              </ThemedText>
              <View style={styles.chipRow}>
                {LIBRARY_SORT_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    label={t(sortTranslationKey(option))}
                    active={sort === option}
                    onPress={() => onSortChange(option)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText variant="caption" secondary>
                {t('library.categoryLabel')}
              </ThemedText>
              <View style={styles.chipRow}>
                <Chip
                  label={t('library.filterAll')}
                  active={category === 'all'}
                  onPress={() => onCategoryChange('all')}
                />
                {BOOK_CATEGORIES.map((value) => (
                  <Chip
                    key={value}
                    label={t(categoryLabelKey(value))}
                    active={category === value}
                    onPress={() => onCategoryChange(value as BookCategory)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText variant="caption" secondary>
                {t('library.priorityLabel')}
              </ThemedText>
              <View style={styles.chipRow}>
                <Chip
                  label={t('library.filterAll')}
                  active={priority === 'all'}
                  onPress={() => onPriorityChange('all')}
                />
                {BOOK_PRIORITIES.map((value) => (
                  <Chip
                    key={value}
                    label={t(`library.priority.${value}`)}
                    active={priority === value}
                    onPress={() => onPriorityChange(value as BookPriority)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button label={t('library.resetFilters')} onPress={onReset} variant="secondary" />
            <Button label={t('common.done')} onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    maxHeight: '85%',
    gap: Spacing.md,
  },
  scroll: { maxHeight: 420 },
  section: { gap: Spacing.sm, marginBottom: Spacing.lg },
  chipRow: {
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
