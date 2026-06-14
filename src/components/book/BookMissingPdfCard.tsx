import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface BookMissingPdfCardProps {
  relinking?: boolean;
  onRelink: () => void;
  onKeepMetadata?: () => void;
  compact?: boolean;
}

export function BookMissingPdfCard({
  relinking = false,
  onRelink,
  onKeepMetadata,
  compact = false,
}: BookMissingPdfCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Card style={[styles.card, compact && styles.compact]}>
      <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ThemedText variant="caption" secondary>
          {t('pdfMissing.badge')}
        </ThemedText>
      </View>
      <ThemedText variant="subtitle">{t('pdfMissing.title')}</ThemedText>
      <ThemedText variant="caption" secondary>
        {t('pdfMissing.progressPreserved')}
      </ThemedText>
      <View style={styles.actions}>
        <Button
          label={relinking ? t('common.loading') : t('pdfMissing.relink')}
          onPress={onRelink}
          disabled={relinking}
        />
        {onKeepMetadata && !compact ? (
          <Button
            label={t('pdfMissing.keepMetadata')}
            onPress={onKeepMetadata}
            variant="secondary"
            disabled={relinking}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  compact: { gap: Spacing.xs },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: { gap: Spacing.sm, marginTop: Spacing.xs },
});
