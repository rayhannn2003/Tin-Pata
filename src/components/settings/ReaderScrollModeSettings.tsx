import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import { READER_SCROLL_MODES, type ReaderScrollMode } from '@/types/reader';

function scrollModeLabelKey(mode: ReaderScrollMode): string {
  switch (mode) {
    case 'horizontal':
      return 'readerPrefs.scrollHorizontal';
    case 'vertical':
    default:
      return 'readerPrefs.scrollVertical';
  }
}

interface ReaderScrollModeSettingsProps {
  value: ReaderScrollMode;
  disabled?: boolean;
  onChange: (mode: ReaderScrollMode) => void;
}

export function ReaderScrollModeSettings({
  value,
  disabled = false,
  onChange,
}: ReaderScrollModeSettingsProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <View style={[styles.block, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <ThemedText style={styles.label}>{t('readerPrefs.scrollMode')}</ThemedText>
        <ThemedText variant="caption" secondary>
          {t('readerPrefs.scrollModeAppliesNext')}
        </ThemedText>
      </View>
      <View style={styles.chips}>
        {READER_SCROLL_MODES.map((mode) => {
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
                {t(scrollModeLabelKey(mode))}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      <ThemedText variant="caption" secondary>
        {t('readerPrefs.scrollModeHorizontalWarning')}
      </ThemedText>
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
