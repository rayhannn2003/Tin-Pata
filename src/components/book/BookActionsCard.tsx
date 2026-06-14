import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import type { BookStatus } from '@/types';

interface BookActionsCardProps {
  onRename: () => void;
  onMarkReading: () => void;
  onMarkPaused: () => void;
  onMarkFinished: () => void;
  onDelete: () => void;
  status: BookStatus;
}

export function BookActionsCard({
  onRename,
  onMarkReading,
  onMarkPaused,
  onMarkFinished,
  onDelete,
  status,
}: BookActionsCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('bookDetail.actions')}</ThemedText>
      <View style={styles.actions}>
        <Button label={t('library.rename')} onPress={onRename} variant="secondary" />
        {status !== 'reading' ? (
          <Button
            label={t('library.markReading')}
            onPress={onMarkReading}
            variant="secondary"
          />
        ) : null}
        {status !== 'paused' ? (
          <Button
            label={t('library.markPaused')}
            onPress={onMarkPaused}
            variant="secondary"
          />
        ) : null}
        {status !== 'finished' ? (
          <Button
            label={t('library.markFinished')}
            onPress={onMarkFinished}
            variant="secondary"
          />
        ) : null}
        <Button label={t('common.delete')} onPress={onDelete} variant="danger" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  actions: { gap: Spacing.sm },
});
