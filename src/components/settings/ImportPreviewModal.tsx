import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n/useTranslation';
import type { BackupErrorCode, BackupPreview, ImportMode } from '@/types/backup';
import { formatImportDate } from '@/utils/format';

interface ImportPreviewModalProps {
  visible: boolean;
  preview: BackupPreview | null;
  validationWarnings: BackupErrorCode[];
  mode: ImportMode;
  importing: boolean;
  onModeChange: (mode: ImportMode) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function ModeChip({
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

export function ImportPreviewModal({
  visible,
  preview,
  validationWarnings,
  mode,
  importing,
  onModeChange,
  onClose,
  onConfirm,
}: ImportPreviewModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (!preview) {
    return null;
  }

  const warnings = [...new Set([...validationWarnings, ...preview.warnings])];

  const countLines = [
    t('backup.previewBooks', { count: preview.bookCount }),
    t('backup.previewSessions', { count: preview.sessionCount }),
    t('backup.previewNotes', { count: preview.noteCount }),
    t('backup.previewBookmarks', { count: preview.bookmarkCount }),
    t('backup.previewGoals', { count: preview.goalCount }),
    t('backup.previewReflections', { count: preview.reflectionCount }),
    t('backup.previewSettings', { count: preview.settingsCount }),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ThemedText variant="title">{t('backup.previewTitle')}</ThemedText>

            <View style={styles.meta}>
              <ThemedText variant="caption" secondary>
                {t('backup.previewBackupDate', { date: formatImportDate(preview.exportedAt) })}
              </ThemedText>
              <ThemedText variant="caption" secondary>
                {t('backup.previewAppVersion', { version: preview.appVersion })}
              </ThemedText>
              <ThemedText variant="caption" secondary>
                {t('backup.previewExportVersion', { version: preview.backupVersion })}
              </ThemedText>
              {preview.platform !== 'unknown' ? (
                <ThemedText variant="caption" secondary>
                  {t('backup.previewPlatform', { platform: preview.platform })}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.counts}>
              {countLines.map((line) => (
                <ThemedText key={line} variant="body">
                  {line}
                </ThemedText>
              ))}
            </View>

            <ThemedText variant="caption" secondary style={{ color: colors.danger }}>
              {t('backup.pdfNotIncluded')}
            </ThemedText>

            {warnings.length > 0 ? (
              <View style={[styles.warningBox, { borderColor: colors.border }]}>
                {warnings.map((code) => (
                  <ThemedText key={code} variant="caption" secondary>
                    • {t(`backup.warnings.${code}`)}
                  </ThemedText>
                ))}
              </View>
            ) : null}

            <View style={styles.modeBlock}>
              <ThemedText variant="label">{t('backup.importMode')}</ThemedText>
              <View style={styles.chips}>
                <ModeChip
                  label={t('backup.mergeMode')}
                  active={mode === 'merge'}
                  onPress={() => onModeChange('merge')}
                />
                <ModeChip
                  label={t('backup.replaceMode')}
                  active={mode === 'replace'}
                  onPress={() => onModeChange('replace')}
                />
              </View>
              <ThemedText variant="caption" secondary>
                {mode === 'merge' ? t('backup.mergeModeDesc') : t('backup.replaceModeDesc')}
              </ThemedText>
              {mode === 'replace' ? (
                <>
                  <ThemedText variant="caption" style={{ color: colors.danger }}>
                    {t('backup.replaceOverwriteWarning')}
                  </ThemedText>
                  <ThemedText variant="caption" secondary>
                    {t('danger.cannotUndo')}
                  </ThemedText>
                </>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="secondary" onPress={onClose} />
            <Button
              label={importing ? t('common.loading') : t('backup.confirmImport')}
              onPress={onConfirm}
              disabled={importing}
              variant={mode === 'replace' ? 'danger' : 'primary'}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  content: { gap: Spacing.md, paddingBottom: Spacing.sm },
  meta: { gap: 2 },
  counts: { gap: 4 },
  warningBox: {
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
  },
  modeBlock: { gap: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { gap: Spacing.sm, paddingTop: Spacing.sm },
});
