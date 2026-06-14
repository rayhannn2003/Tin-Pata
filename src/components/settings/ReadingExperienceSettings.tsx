import { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useReaderPreferences } from '@/features/reader/useReaderPreferences';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

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
  const colors = useThemeColors();
  const { preferences, loading, saving, updatePreferences } = useReaderPreferences();

  const comingLaterItems = useMemo(
    () => [
      t('focus.title'),
      t('readerPrefs.fitMode'),
      t('readerPrefs.scrollMode'),
      t('readerPrefs.defaultFocusMode'),
    ],
    [t],
  );

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

      <SettingSwitch
        label={t('readerPrefs.showTimer')}
        value={preferences.showTimer}
        onChange={(showTimer) => void updatePreferences({ showTimer })}
        disabled={disabled}
      />

      <SettingSwitch
        label={t('readerPrefs.showProgress')}
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

      <View style={[styles.comingLater, { borderTopColor: colors.border }]}>
        <ThemedText variant="label" secondary>
          {t('readerPrefs.comingLater')}
        </ThemedText>
        <ThemedText variant="caption" secondary>
          {comingLaterItems.join(' · ')}
        </ThemedText>
        <ThemedText variant="caption" secondary>
          {t('readerPrefs.stabilityNote')}
        </ThemedText>
      </View>
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
  comingLater: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
