import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/layout';
import { useAuth } from '@/features/auth/AuthProvider';
import { useTranslation } from '@/i18n/useTranslation';
import { SyncEngineService } from '@/services/SyncEngineService';
import { SyncPreparationService } from '@/services/SyncPreparationService';
import type { SyncEngineStatus, SyncIntegrityReport } from '@/types/sync';
import { formatLastReadDate } from '@/utils/format';

function formatSyncCheckSummary(report: SyncIntegrityReport): string {
  const items = [...report.warnings, ...report.errors];
  if (items.length === 0) {
    return '';
  }
  return items
    .slice(0, 5)
    .map((item) => (item.count ? `${item.message} (${item.count})` : item.message))
    .join('\n');
}

export function CloudSyncSection() {
  const { t } = useTranslation();
  const { user, isConfigured } = useAuth();
  const [status, setStatus] = useState<SyncEngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const next = await SyncEngineService.getSyncStatus();
    setStatus(next);
  }, []);

  useEffect(() => {
    let active = true;
    void refresh()
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [refresh, user?.id]);

  const handleLinkLocalData = () => {
    if (!user) {
      return;
    }

    Alert.alert(t('sync.linkTitle'), t('sync.linkWarning'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('sync.prepareLocalData'),
        onPress: () => {
          setBusy(true);
          void SyncPreparationService.linkLocalDataToAccount(user.id)
            .then(() => refresh())
            .catch((error: unknown) => {
              const message = error instanceof Error ? error.message : t('sync.syncFailed');
              Alert.alert(t('sync.syncFailed'), message);
            })
            .finally(() => setBusy(false));
        },
      },
    ]);
  };

  const handleSyncNow = () => {
    setBusy(true);
    void SyncEngineService.syncNow()
      .then((result) => {
        if (result.failed > 0) {
          Alert.alert(t('sync.syncWarning'), t('sync.someSyncIssues'));
        } else {
          Alert.alert(t('sync.metadataSynced'));
        }
        return refresh();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t('sync.syncFailed');
        Alert.alert(t('sync.syncFailed'), message);
        return refresh();
      })
      .finally(() => setBusy(false));
  };

  const handleRetryFailed = () => {
    setBusy(true);
    void SyncEngineService.retryFailedSync()
      .then((result) => {
        if (result.failed > 0) {
          Alert.alert(t('sync.syncWarning'), result.errors[0] ?? t('sync.someSyncIssues'));
        } else {
          Alert.alert(t('sync.metadataSynced'));
        }
        return refresh();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t('sync.syncFailed');
        Alert.alert(t('sync.syncFailed'), message);
        return refresh();
      })
      .finally(() => setBusy(false));
  };

  const handleRunSyncCheck = () => {
    setBusy(true);
    void SyncEngineService.runSyncCheck()
      .then((report) => {
        if (report.ok) {
          Alert.alert(t('sync.syncCheck'), t('sync.noSyncIssues'));
          return;
        }

        Alert.alert(t('sync.syncWarning'), formatSyncCheckSummary(report), [
          { text: t('common.ok'), style: 'cancel' },
          {
            text: t('sync.syncRepair'),
            onPress: () => {
              setBusy(true);
              void SyncEngineService.runSafeRepairs(report)
                .then(() => {
                  Alert.alert(t('sync.syncRepair'), t('sync.metadataSynced'));
                  return refresh();
                })
                .catch((error: unknown) => {
                  const message = error instanceof Error ? error.message : t('sync.syncFailed');
                  Alert.alert(t('sync.syncFailed'), message);
                  return refresh();
                })
                .finally(() => setBusy(false));
            },
          },
        ]);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t('sync.syncFailed');
        Alert.alert(t('sync.syncFailed'), message);
      })
      .finally(() => setBusy(false));
  };

  const handleClearSyncedQueue = () => {
    Alert.alert(t('sync.clearSyncedQueueTitle'), t('sync.clearSyncedQueueMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('sync.clearSyncedQueueConfirm'),
        onPress: () => {
          setBusy(true);
          void SyncEngineService.clearSyncedQueueItems()
            .then(() => refresh())
            .finally(() => setBusy(false));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator />
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const statusLabel = (() => {
    if (!isConfigured || !user) {
      return t('sync.statusLocalOnly');
    }
    switch (status.state) {
      case 'not_enabled':
        return t('sync.statusLocalOnly');
      case 'ready':
        return status.isLinked ? t('sync.statusReady') : t('sync.localNotLinked');
      case 'syncing':
        return t('sync.statusSyncing');
      case 'synced':
        return t('sync.statusSynced');
      case 'error':
        return t('sync.syncError');
      default:
        return t('sync.cloudSyncStatus');
    }
  })();

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('sync.cloudSync')}</ThemedText>
      <ThemedText variant="caption" secondary>
        {t('sync.metadataOnly')}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {t('sync.pdfBackupManual')}
      </ThemedText>
      <ThemedText variant="caption" secondary>
        {t('sync.localOffline')}
      </ThemedText>

      {!isConfigured || !user ? (
        <>
          <ThemedText variant="caption" secondary>
            {statusLabel}
          </ThemedText>
          <ThemedText variant="caption" secondary>
            {t('sync.signInToEnable')}
          </ThemedText>
        </>
      ) : (
        <>
          <ThemedText variant="caption" secondary>
            {statusLabel}
          </ThemedText>
          {status.isLinked ? (
            <>
              <ThemedText variant="caption" secondary>
                {t('sync.lastSync')}:{' '}
                {status.lastSyncAt ? formatLastReadDate(status.lastSyncAt) : t('sync.neverSynced')}
              </ThemedText>
              <ThemedText variant="caption" secondary>
                {t('sync.pendingChanges', { count: status.pendingCount })}
              </ThemedText>
              {status.failedCount > 0 ? (
                <ThemedText variant="caption" secondary>
                  {t('sync.failedChanges', { count: status.failedCount })}
                </ThemedText>
              ) : null}
              {status.lastError ? (
                <ThemedText variant="caption" secondary>
                  {status.lastError}
                </ThemedText>
              ) : null}
              <View style={styles.actions}>
                <Button label={t('sync.syncNow')} onPress={handleSyncNow} disabled={busy} />
                {status.failedCount > 0 ? (
                  <Button
                    label={t('sync.retryFailedSync')}
                    onPress={handleRetryFailed}
                    variant="secondary"
                    disabled={busy}
                  />
                ) : null}
                <Button
                  label={t('sync.runSyncCheck')}
                  onPress={handleRunSyncCheck}
                  variant="secondary"
                  disabled={busy}
                />
                <Button
                  label={t('sync.clearSyncedQueue')}
                  onPress={handleClearSyncedQueue}
                  variant="secondary"
                  disabled={busy}
                />
              </View>
            </>
          ) : (
            <View style={styles.actions}>
              <ThemedText variant="caption" secondary>
                {t('sync.localNotLinked')}
              </ThemedText>
              <Button
                label={t('sync.prepareLocalData')}
                onPress={handleLinkLocalData}
                variant="secondary"
                disabled={busy}
              />
            </View>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  actions: { gap: Spacing.sm, marginTop: Spacing.xs },
});
