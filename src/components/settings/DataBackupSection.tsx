import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ImportPreviewModal } from '@/components/settings/ImportPreviewModal';
import { ImportResultModal } from '@/components/settings/ImportResultModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { BackupService } from '@/services/BackupService';
import { LanguageService } from '@/services/LanguageService';
import { useThemeColors } from '@/hooks/useColorScheme';
import {
  BackupError,
  buildBackupPreview,
  type BackupErrorCode,
  type BackupPayload,
  type BackupPreview,
  type ImportMode,
  type ImportResult,
} from '@/types/backup';
import { formatImportDate } from '@/utils/format';

function backupErrorMessage(code: BackupErrorCode, t: (key: string) => string): string {
  const key = `backup.errors.${code}`;
  const translated = t(key);
  return translated === key ? t('backup.errors.import_failed') : translated;
}

export function DataBackupSection() {
  const colors = useThemeColors();
  const { t, setLanguage } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<BackupPayload | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<BackupErrorCode[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const refreshLastBackup = useCallback(async () => {
    const stored = await BackupService.getLastBackupAt();
    setLastBackupAt(stored);
  }, []);

  useEffect(() => {
    void refreshLastBackup();
  }, [refreshLastBackup]);

  const handleExport = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError(t('backup.errors.import_failed'));
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
      if (err instanceof BackupError) {
        setError(backupErrorMessage(err.code, t));
      } else {
        setError(err instanceof Error ? err.message : t('settings.exportError'));
      }
    } finally {
      setExporting(false);
    }
  }, [refreshLastBackup, t]);

  const closePreview = useCallback(() => {
    setPreviewVisible(false);
    setPendingPayload(null);
    setPreview(null);
    setValidationWarnings([]);
    setImportMode('merge');
  }, []);

  const runImport = useCallback(async () => {
    if (!pendingPayload) {
      return;
    }
    try {
      setImporting(true);
      setError(null);
      setMessage(null);
      const result = await BackupService.importBackup(pendingPayload, importMode);
      const language = await LanguageService.getLanguage();
      await setLanguage(language);
      setImportResult(result);
      setPreviewVisible(false);
      setResultVisible(true);
      setPendingPayload(null);
      setPreview(null);
    } catch (err) {
      if (err instanceof BackupError) {
        setError(backupErrorMessage(err.code, t));
      } else {
        setError(err instanceof Error ? err.message : t('settings.importError'));
      }
      setPreviewVisible(false);
    } finally {
      setImporting(false);
    }
  }, [importMode, pendingPayload, setLanguage, t]);

  const handleImport = useCallback(() => {
    void (async () => {
      try {
        setError(null);
        const { payload, warnings } = await BackupService.pickAndValidateBackup();
        setPendingPayload(payload);
        setPreview(buildBackupPreview(payload));
        setValidationWarnings(warnings);
        setImportMode('merge');
        setPreviewVisible(true);
      } catch (err) {
        if (err instanceof BackupError && err.code === 'import_cancelled') {
          return;
        }
        if (err instanceof BackupError) {
          setError(backupErrorMessage(err.code, t));
        } else {
          setError(err instanceof Error ? err.message : t('settings.importError'));
        }
      }
    })();
  }, [t]);

  return (
    <>
      <Card style={styles.card}>
        <ThemedText variant="caption" secondary>
          {t('settings.backupExplain')}
        </ThemedText>

        <ThemedText variant="caption" secondary>
          {t('backup.backupNoPdfs')}
        </ThemedText>

        <ThemedText variant="caption" secondary>
          {t('backup.relinkAfterRestore')}
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

      <ImportPreviewModal
        visible={previewVisible}
        preview={preview}
        validationWarnings={validationWarnings}
        mode={importMode}
        importing={importing}
        onModeChange={setImportMode}
        onClose={closePreview}
        onConfirm={() => void runImport()}
      />

      <ImportResultModal
        visible={resultVisible}
        result={importResult}
        onClose={() => {
          setResultVisible(false);
          setImportResult(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  actions: { gap: Spacing.sm },
});
