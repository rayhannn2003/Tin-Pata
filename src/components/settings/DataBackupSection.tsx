import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { BackupService } from '@/services/BackupService';
import { LanguageService } from '@/services/LanguageService';
import { useThemeColors } from '@/hooks/useColorScheme';
import { buildBackupPreview } from '@/types/backup';
import { formatImportDate } from '@/utils/format';

export function DataBackupSection() {
  const colors = useThemeColors();
  const { t, setLanguage } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);

  const refreshLastBackup = useCallback(async () => {
    const stored = await BackupService.getLastBackupAt();
    setLastBackupAt(stored);
  }, []);

  useEffect(() => {
    void refreshLastBackup();
  }, [refreshLastBackup]);

  const handleExport = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('Web preview does not support export.');
      return;
    }
    try {
      setExporting(true);
      setError(null);
      setMessage(null);
      await BackupService.exportData();
      await refreshLastBackup();
      setMessage(t('settings.exportSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.exportError'));
    } finally {
      setExporting(false);
    }
  }, [refreshLastBackup, t]);

  const runImport = useCallback(
    async (payload: Awaited<ReturnType<typeof BackupService.parseBackupFromPicker>>) => {
      try {
        setImporting(true);
        setError(null);
        setMessage(null);
        await BackupService.replaceDataFromBackup(payload);
        const language = await LanguageService.getLanguage();
        await setLanguage(language);
        setMessage(t('settings.importSuccess'));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('settings.importError'));
      } finally {
        setImporting(false);
      }
    },
    [setLanguage, t],
  );

  const handleImport = useCallback(() => {
    void (async () => {
      try {
        setError(null);
        const payload = await BackupService.parseBackupFromPicker();
        const preview = buildBackupPreview(payload);

        const body = [
          t('backup.previewBooks', { count: preview.bookCount }),
          t('backup.previewSessions', { count: preview.sessionCount }),
          t('backup.previewNotes', { count: preview.noteCount }),
          t('backup.previewBookmarks', { count: preview.bookmarkCount }),
          t('backup.previewReflections', { count: preview.reflectionCount }),
          t('backup.previewExportedAt', { date: formatImportDate(preview.exportedAt) }),
          t('backup.previewAppVersion', { version: preview.appVersion }),
          t('backup.previewExportVersion', { version: preview.exportVersion }),
          '',
          t('settings.importConfirmMessage'),
          '',
          t('backup.pdfWarning'),
        ].join('\n');

        Alert.alert(t('backup.previewTitle'), body, [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: () => {
              void runImport(payload);
            },
          },
        ]);
      } catch (err) {
        if (err instanceof Error && err.message === 'Import cancelled.') {
          return;
        }
        setError(err instanceof Error ? err.message : t('settings.importError'));
      }
    })();
  }, [runImport, t]);

  return (
    <Card style={styles.card}>
      <ThemedText variant="caption" secondary>
        {t('settings.backupExplain')}
      </ThemedText>

      <ThemedText variant="caption" secondary>
        {t('backup.pdfWarning')}
      </ThemedText>

      {lastBackupAt ? (
        <ThemedText variant="caption" style={{ color: colors.tint }}>
          {t('backup.lastBackup', { date: formatImportDate(lastBackupAt) })}
        </ThemedText>
      ) : (
        <ThemedText variant="caption" style={{ color: colors.danger }}>
          {t('backup.noBackupYet')}
        </ThemedText>
      )}

      {error ? (
        <ThemedText variant="caption" style={{ color: colors.danger }}>
          {error}
        </ThemedText>
      ) : null}

      {message ? (
        <ThemedText variant="caption" style={{ color: colors.tint }}>
          {message}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={exporting ? t('common.loading') : t('settings.exportData')}
          onPress={() => void handleExport()}
          disabled={exporting || importing}
        />
        <Button
          label={importing ? t('common.loading') : t('settings.importData')}
          onPress={handleImport}
          disabled={exporting || importing}
          variant="secondary"
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  actions: { gap: Spacing.sm },
});
