import { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { BackupService } from '@/services/BackupService';
import { LanguageService } from '@/services/LanguageService';
import { useThemeColors } from '@/hooks/useColorScheme';

export function DataBackupSection() {
  const colors = useThemeColors();
  const { t, setLanguage } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setMessage(t('settings.exportSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.exportError'));
    } finally {
      setExporting(false);
    }
  }, [t]);

  const runImport = useCallback(async () => {
    try {
      setImporting(true);
      setError(null);
      setMessage(null);
      await BackupService.importDataFromFile();
      const language = await LanguageService.getLanguage();
      await setLanguage(language);
      setMessage(t('settings.importSuccess'));
    } catch (err) {
      if (err instanceof Error && err.message === 'Import cancelled.') {
        return;
      }
      setError(err instanceof Error ? err.message : t('settings.importError'));
    } finally {
      setImporting(false);
    }
  }, [setLanguage, t]);

  const handleImport = useCallback(() => {
    Alert.alert(t('settings.importConfirmTitle'), t('settings.importConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => {
          void runImport();
        },
      },
    ]);
  }, [runImport, t]);

  return (
    <Card style={styles.card}>
      <ThemedText variant="caption" secondary>
        {t('settings.backupExplain')}
      </ThemedText>

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
