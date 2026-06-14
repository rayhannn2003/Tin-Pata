import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';

import { AppEmptyState } from '@/components/common/AppEmptyState';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useReflections } from '@/features/reflections/useReflections';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { formatImportDate } from '@/utils/format';

export function ReflectionHistory() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { reflections, loading, deleteReflection } = useReflections();

  const handleDelete = (id: string) => {
    Alert.alert(t('reflections.deleteTitle'), t('reflections.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void deleteReflection(id);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (reflections.length === 0) {
    return (
      <AppEmptyState
        title={t('reflections.emptyTitle')}
        message={t('reflections.emptyMessage')}
      />
    );
  }

  return (
    <FlatList
      data={reflections}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Card style={styles.item}>
          <ThemedText style={styles.text}>{item.text}</ThemedText>
          <View style={styles.footer}>
            <ThemedText variant="caption" secondary>
              {formatImportDate(item.createdAt)}
            </ThemedText>
            <ThemedText
              variant="caption"
              style={{ color: colors.danger }}
              onPress={() => handleDelete(item.id)}
            >
              {t('common.delete')}
            </ThemedText>
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { paddingVertical: Spacing.lg, alignItems: 'center' },
  list: { gap: Spacing.sm },
  item: { gap: Spacing.sm },
  text: { lineHeight: 22 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
