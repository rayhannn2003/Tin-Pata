import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { READER_FIT_MODES, type ReaderFitMode } from '@/types/reader';

function fitModeLabelKey(mode: ReaderFitMode): string {
  switch (mode) {
    case 'width':
      return 'readerPrefs.fitWidth';
    case 'page':
      return 'readerPrefs.fitPage';
    case 'auto':
    default:
      return 'readerPrefs.fitAuto';
  }
}

interface ReaderFitModeSettingsProps {
  value: ReaderFitMode;
  disabled?: boolean;
  onChange: (mode: ReaderFitMode) => void;
}

export function ReaderFitModeSettings({
  value,
  disabled = false,
  onChange,
}: ReaderFitModeSettingsProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.block, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <ThemedText style={styles.label}>{t('readerPrefs.fitMode')}</ThemedText>
        <ThemedText variant="caption" secondary>
          {t('readerPrefs.fitModeAppliesNext')}
        </ThemedText>
      </View>
      <View style={styles.chips}>
        {READER_FIT_MODES.map((mode) => {
          const active = value === mode;
          return (
            <Pressable
              key={mode}
              disabled={disabled}
              onPress={() => onChange(mode)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.tintMuted : colors.surface,
                  borderColor: active ? colors.tint : colors.border,
                  opacity: disabled ? 0.6 : 1,
                },
              ]}
            >
              <ThemedText
                variant="caption"
                style={{ color: active ? colors.tint : colors.textSecondary }}
              >
                {t(fitModeLabelKey(mode))}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: { gap: 2 },
  label: { fontWeight: '600', fontSize: 15 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
