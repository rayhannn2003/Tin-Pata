import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { useTranslation } from '@/i18n/useTranslation';
import type { ImportResult } from '@/types/backup';

interface ImportResultModalProps {
  visible: boolean;
  result: ImportResult | null;
  onClose: () => void;
}

export function ImportResultModal({ visible, result, onClose }: ImportResultModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (!result) {
    return null;
  }

  const title = result.hadWarnings ? t('backup.importWithWarnings') : t('backup.importCompleted');

  const importedLines = [
    t('backup.resultBooks', { count: result.booksImported }),
    t('backup.resultSessions', { count: result.sessionsImported }),
    t('backup.resultNotes', { count: result.notesImported }),
    t('backup.resultBookmarks', { count: result.bookmarksImported }),
    t('backup.resultGoals', { count: result.goalsImported }),
    t('backup.resultReflections', { count: result.reflectionsImported }),
    t('backup.resultSettings', { count: result.settingsImported }),
  ];

  const skippedTotal =
    result.booksSkipped +
    result.sessionsSkipped +
    result.notesSkipped +
    result.bookmarksSkipped +
    result.goalsSkipped +
    result.reflectionsSkipped +
    result.settingsSkipped;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ThemedText variant="title">{title}</ThemedText>
            <ThemedText variant="caption" secondary>
              {result.mode === 'merge' ? t('backup.mergeMode') : t('backup.replaceMode')}
            </ThemedText>

            <ThemedText variant="body">
              {t('backup.resultRestoredSummary', {
                books: result.booksImported,
                relink: result.missingPdfCount,
              })}
            </ThemedText>

            {result.notesImported > 0 || result.bookmarksImported > 0 ? (
              <ThemedText variant="caption" secondary>
                {t('backup.resultAnnotationsPreserved')}
              </ThemedText>
            ) : null}

            <ThemedText variant="caption" secondary>
              {t('backup.backupNoPdfs')}
            </ThemedText>

            <View style={styles.section}>
              {importedLines.map((line) => (
                <ThemedText key={line} variant="body">
                  {line}
                </ThemedText>
              ))}
            </View>

            {skippedTotal > 0 ? (
              <ThemedText variant="caption" secondary>
                {t('backup.resultSkipped', { count: skippedTotal })}
              </ThemedText>
            ) : null}

            {result.missingPdfCount > 0 ? (
              <ThemedText variant="caption" style={{ color: colors.danger }}>
                {t('backup.booksNeedRelink', { count: result.missingPdfCount })}
              </ThemedText>
            ) : null}

            {result.warnings.length > 0 ? (
              <View style={[styles.warningBox, { borderColor: colors.border }]}>
                {result.warnings.map((code) => (
                  <ThemedText key={code} variant="caption" secondary>
                    • {t(`backup.warnings.${code}`)}
                  </ThemedText>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <Button label={t('common.close')} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.lg,
  },
  sheet: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  content: { gap: Spacing.md, paddingBottom: Spacing.sm },
  section: { gap: 4 },
  warningBox: {
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
  },
});
