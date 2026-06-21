import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/layout';
import { useTranslation } from '@/i18n/useTranslation';
import { SyncPreparationService } from '@/services/SyncPreparationService';
import type { LocalSyncSummary } from '@/types/sync';

export function SyncReadinessSection() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<LocalSyncSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void SyncPreparationService.getCurrentLocalSyncSummary()
      .then((value) => {
        if (active) {
          setSummary(value);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator />
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card style={styles.card} muted>
      <ThemedText variant="caption" secondary>
        {t('sync.deviceIdLabel')}: {summary.deviceIdShort}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {t('sync.syncReadyCount', { count: summary.syncReadyRecordCount })}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {t('sync.cloudSyncStatus')}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
});
