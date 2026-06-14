import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useLanguagePreference } from '@/features/language/useLanguagePreference';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { SUPPORTED_LANGUAGES } from '@/types/language';
import { useThemeColors } from '@/hooks/useColorScheme';

export function LanguagePicker() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { language, setLanguage, loading } = useLanguagePreference();

  return (
    <Card style={styles.card}>
      <ThemedText variant="caption" secondary>
        {t('settings.languageSubtitle')}
      </ThemedText>
      <View style={styles.row}>
        {SUPPORTED_LANGUAGES.map(({ code, label }) => {
          const active = language === code;
          return (
            <Pressable
              key={code}
              onPress={() => {
                if (!loading && !active) {
                  void setLanguage(code);
                }
              }}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.tintMuted : colors.background,
                  borderColor: active ? colors.tint : colors.border,
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
