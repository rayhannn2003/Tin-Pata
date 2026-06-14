import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { ReaderBrightnessControls } from '@/components/reader/ReaderBrightnessControls';
import { ReaderFitModeSettings } from '@/components/settings/ReaderFitModeSettings';
import { ReaderScrollModeSettings } from '@/components/settings/ReaderScrollModeSettings';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useReaderPreferences } from '@/features/reader/useReaderPreferences';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { ReaderBrightnessService } from '@/services/ReaderBrightnessService';

function SettingSwitch({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
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

export function ReadingExperienceSettings() {
  const { t } = useTranslation();
  const { preferences, loading, saving, updatePreferences } = useReaderPreferences();
  const [brightnessAvailable, setBrightnessAvailable] = useState(false);

  useEffect(() => {
    void ReaderBrightnessService.isAvailable().then(setBrightnessAvailable);
  }, []);

  if (!preferences) {
    return null;
  }

  const disabled = loading || saving;

  return (
    <Card style={styles.card}>
      <ThemedText variant="caption" secondary>
        {t('readerPrefs.intro')}
      </ThemedText>

      <SettingSwitch
        label={t('readerPrefs.keepAwake')}
        description={t('readerPrefs.keepAwakeDesc')}
        value={preferences.keepAwake}
        onChange={(keepAwake) => void updatePreferences({ keepAwake })}
        disabled={disabled}
      />

      {brightnessAvailable ? (
        <ReaderBrightnessControls
          enabled={preferences.brightnessEnabled}
          value={preferences.brightnessValue}
          disabled={disabled}
          onEnabledChange={(brightnessEnabled) => void updatePreferences({ brightnessEnabled })}
          onValueChange={(brightnessValue) => void updatePreferences({ brightnessValue })}
        />
      ) : ReaderBrightnessService.isPlatformSupported() ? (
        <ThemedText variant="caption" secondary>
          {t('readerPrefs.brightnessRebuildHint')}
        </ThemedText>
      ) : null}

      <ReaderFitModeSettings
        value={preferences.fitMode}
        disabled={disabled}
        onChange={(fitMode) => void updatePreferences({ fitMode })}
      />

      <ReaderScrollModeSettings
        value={preferences.scrollMode}
        disabled={disabled}
        onChange={(scrollMode) => void updatePreferences({ scrollMode })}
      />

      <SettingSwitch
        label={t('readerPrefs.showTimer')}
        description={t('readerPrefs.showTimerDesc')}
        value={preferences.showTimer}
        onChange={(showTimer) => void updatePreferences({ showTimer })}
        disabled={disabled}
      />

      <SettingSwitch
        label={t('readerPrefs.showProgress')}
        description={t('readerPrefs.showProgressDesc')}
        value={preferences.showProgress}
        onChange={(showProgress) => void updatePreferences({ showProgress })}
        disabled={disabled}
      />

      <SettingSwitch
        label={t('readerPrefs.compactActions')}
        description={t('readerPrefs.compactActionsDesc')}
        value={preferences.compactActions}
        onChange={(compactActions) => void updatePreferences({ compactActions })}
        disabled={disabled}
      />

      <SettingSwitch
        label={t('readerPrefs.defaultFocusMode')}
        description={t('focus.description')}
        value={preferences.defaultFocusMode}
        onChange={(defaultFocusMode) => void updatePreferences({ defaultFocusMode })}
        disabled={disabled}
      />

      <ThemedText variant="caption" secondary>
        {t('readerPrefs.stabilityNote')}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
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
