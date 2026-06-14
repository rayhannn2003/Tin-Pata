import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';

export function HomeHeader() {
  const { t } = useTranslation();

  const motivationalLine = useMemo(() => {
    const lines = [
      t('home.subtitleSmallProgress'),
      t('home.subtitleOnePage'),
      t('home.subtitleContinue'),
      t('home.subtitleNoPressure'),
    ];
    return lines[new Date().getDate() % lines.length];
  }, [t]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return t('home.greetingMorning');
    }
    if (hour < 17) {
      return t('home.greetingAfternoon');
    }
    return t('home.greetingEvening');
  }, [t]);

  return (
    <View style={styles.container}>
      <ThemedText variant="title">{greeting}</ThemedText>
      <ThemedText secondary style={styles.subtitle}>
        {motivationalLine}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs, marginBottom: Spacing.xl },
  subtitle: { lineHeight: 22 },
});
