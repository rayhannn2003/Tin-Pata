import { StyleSheet, Switch, View } from 'react-native';

import { SimpleSlider } from '@/components/ui/SimpleSlider';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { clampReaderBrightness } from '@/services/ReaderBrightnessService';

interface ReaderBrightnessControlsProps {
  enabled: boolean;
  value: number;
  disabled?: boolean;
  showToggle?: boolean;
  onEnabledChange?: (next: boolean) => void;
  onValueChange: (next: number) => void;
  onValueChangeComplete?: (next: number) => void;
}

export function ReaderBrightnessControls({
  enabled,
  value,
  disabled = false,
  showToggle = true,
  onEnabledChange,
  onValueChange,
  onValueChangeComplete,
}: ReaderBrightnessControlsProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const clamped = clampReaderBrightness(value);

  return (
    <View style={styles.container}>
      {showToggle ? (
        <View style={[styles.row, { borderColor: colors.border }]}>
          <View style={styles.rowText}>
            <ThemedText style={styles.rowLabel}>{t('readerPrefs.readerBrightness')}</ThemedText>
            <ThemedText variant="caption" secondary>
              {t('readerPrefs.readerBrightnessDesc')}
            </ThemedText>
          </View>
          <Switch
            value={enabled}
            onValueChange={onEnabledChange}
            disabled={disabled}
            trackColor={{ false: colors.border, true: colors.tintMuted }}
            thumbColor={enabled ? colors.tint : colors.surface}
          />
        </View>
      ) : null}

      {enabled ? (
        <View style={styles.sliderBlock}>
          <View style={styles.sliderHeader}>
            <ThemedText variant="caption" secondary>
              {t('readerPrefs.brightnessLevel')}
            </ThemedText>
            <ThemedText variant="caption" style={{ color: colors.tint }}>
              {Math.round(clamped * 100)}%
            </ThemedText>
          </View>
          <SimpleSlider
            value={clamped}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            disabled={disabled}
            onValueChange={(next) => onValueChange(clampReaderBrightness(next))}
            onSlidingComplete={(next) =>
              onValueChangeComplete?.(clampReaderBrightness(next))
            }
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
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
  sliderBlock: { gap: Spacing.xs, paddingBottom: Spacing.xs },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
