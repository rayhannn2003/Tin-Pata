import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { ReaderBrightnessControls } from '@/components/reader/ReaderBrightnessControls';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { ReaderPreferences } from '@/types/reader';

interface ReaderComfortModalProps {
  visible: boolean;
  preferences: ReaderPreferences;
  brightnessAvailable: boolean;
  saving?: boolean;
  onClose: () => void;
  onUpdate: (patch: Partial<ReaderPreferences>) => void;
  onBrightnessSlideComplete?: (value: number) => void;
}

function ComfortSwitch({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowText}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {description ? (
          <ThemedText variant="caption" secondary>
            {description}
          </ThemedText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.tintMuted }}
        thumbColor={value ? colors.tint : colors.surface}
      />
    </View>
  );
}

export function ReaderComfortModal({
  visible,
  preferences,
  brightnessAvailable,
  saving = false,
  onClose,
  onUpdate,
  onBrightnessSlideComplete,
}: ReaderComfortModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const disabled = saving;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ThemedText variant="subtitle">{t('reader.comfortTitle')}</ThemedText>
          <ThemedText variant="caption" secondary>
            {t('reader.comfortSubtitle')}
          </ThemedText>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {brightnessAvailable ? (
              <ReaderBrightnessControls
                enabled={preferences.brightnessEnabled}
                value={preferences.brightnessValue}
                disabled={disabled}
                onEnabledChange={(brightnessEnabled) => void onUpdate({ brightnessEnabled })}
                onValueChange={(brightnessValue) => void onUpdate({ brightnessValue })}
                onValueChangeComplete={onBrightnessSlideComplete}
              />
            ) : (
              <ThemedText variant="caption" secondary>
                {t('reader.brightnessUnavailable')}
              </ThemedText>
            )}

            <ComfortSwitch
              label={t('readerPrefs.showTimer')}
              description={t('readerPrefs.showTimerDesc')}
              value={preferences.showTimer}
              disabled={disabled}
              onChange={(showTimer) => void onUpdate({ showTimer })}
            />

            <ComfortSwitch
              label={t('readerPrefs.showProgress')}
              description={t('readerPrefs.showProgressDesc')}
              value={preferences.showProgress}
              disabled={disabled}
              onChange={(showProgress) => void onUpdate({ showProgress })}
            />

            <ComfortSwitch
              label={t('readerPrefs.compactActions')}
              description={t('readerPrefs.compactActionsDesc')}
              value={preferences.compactActions}
              disabled={disabled}
              onChange={(compactActions) => void onUpdate({ compactActions })}
            />
          </ScrollView>

          <Button label={t('common.done')} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.sm,
    maxHeight: '85%',
  },
  scroll: { maxHeight: 420 },
  scrollContent: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontWeight: '600', fontSize: 15 },
});
