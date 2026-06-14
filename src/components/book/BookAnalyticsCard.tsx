import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import type { BookStats } from '@/types/bookStats';
import { formatImportDate } from '@/utils/format';
import { parseDateKey } from '@/utils/date';

interface BookAnalyticsCardProps {
  stats: BookStats;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <ThemedText variant="caption" secondary>
        {label}
      </ThemedText>
      <ThemedText variant="subtitle">{value}</ThemedText>
    </View>
  );
}

export function BookAnalyticsCard({ stats }: BookAnalyticsCardProps) {
  const { t } = useTranslation();

  const bestSessionValue =
    stats.bestSessionPages > 0 || stats.bestSessionMinutes > 0
      ? t('bookDetail.bestSessionValue', {
          pages: stats.bestSessionPages,
          minutes: stats.bestSessionMinutes,
        })
      : '—';

  const finishValue = stats.canEstimateFinish && stats.estimatedFinishDateKey
    ? t('bookDetail.estimatedFinishValue', {
        date: formatImportDate(parseDateKey(stats.estimatedFinishDateKey).toISOString()),
        days: stats.estimatedFinishDays ?? 0,
      })
    : t('bookDetail.estimatedFinishUnavailable');

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('bookDetail.bookAnalytics')}</ThemedText>
      <View style={styles.grid}>
        <StatItem
          label={t('bookDetail.avgPages')}
          value={String(stats.averagePagesPerSession)}
        />
        <StatItem
          label={t('bookDetail.avgMinutes')}
          value={String(stats.averageMinutesPerSession)}
        />
        <StatItem label={t('bookDetail.bestSession')} value={bestSessionValue} />
      </View>
      <View style={styles.estimateBlock}>
        <ThemedText variant="caption" secondary>
          {t('bookDetail.estimatedFinish')}
        </ThemedText>
        <ThemedText variant="caption">{finishValue}</ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    width: '46%',
    gap: Spacing.xs,
  },
  estimateBlock: { gap: Spacing.xs },
});
