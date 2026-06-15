import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { BackupHealthSnapshot } from '@/services/BackupHealthService';
import { formatImportDate } from '@/utils/format';

interface BackupHealthCardProps {
  health: BackupHealthSnapshot | null;
  loading?: boolean;
}

export function BackupHealthCard({ health, loading = false }: BackupHealthCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  if (loading || !health) {
    return null;
  }

  return (
    <Card muted style={styles.card}>
      <ThemedText variant="label">{t('backup.healthTitle')}</ThemedText>

      {health.lastBackupAt ? (
        <ThemedText variant="caption" style={{ color: colors.tint }}>
          {t('backup.lastBackup', { date: formatImportDate(health.lastBackupAt) })}
        </ThemedText>
      ) : (
        <ThemedText variant="caption" style={{ color: colors.danger }}>
          {t('backup.noBackupYet')}
        </ThemedText>
      )}

      <View style={styles.stats}>
        <ThemedText variant="caption" secondary>
          {t('backup.healthBooks', { count: health.bookCount })}
        </ThemedText>
        {health.missingPdfCount > 0 ? (
          <ThemedText variant="caption" style={{ color: colors.danger }}>
            {t('backup.healthMissingPdfs', { count: health.missingPdfCount })}
          </ThemedText>
        ) : null}
        <ThemedText variant="caption" secondary>
          {t('backup.healthAnnotations', {
            notes: health.noteCount,
            bookmarks: health.bookmarkCount,
          })}
        </ThemedText>
      </View>

      <ThemedText variant="caption" secondary>
        {t('backup.healthReminder')}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  stats: { gap: 2 },
});
