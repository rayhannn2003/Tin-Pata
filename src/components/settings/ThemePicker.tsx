import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { useThemePreference } from '@/features/theme/useThemePreference';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { ThemePreference } from '@/types/theme';

export function ThemePicker() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { preference, setPreference, loading } = useThemePreference();

  const options = useMemo(
    (): { key: ThemePreference; label: string }[] => [
      { key: 'system', label: t('settings.themeSystem') },
      { key: 'light', label: t('settings.themeLight') },
      { key: 'dark', label: t('settings.themeDark') },
    ],
    [t],
  );

  return (
    <Card style={styles.card}>
      <ThemedText variant="caption" secondary>
        {t('settings.themeSubtitle')}
      </ThemedText>
      <View style={styles.row}>
        {options.map(({ key, label }) => {
          const active = preference === key;
          return (
            <Pressable
              key={key}
              disabled={loading}
              onPress={() => void setPreference(key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.tintMuted : colors.background,
                  borderColor: active ? colors.tint : colors.border,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
            >
              <ThemedText
                variant="caption"
                style={{ color: active ? colors.tint : colors.textSecondary, fontWeight: '600' }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
