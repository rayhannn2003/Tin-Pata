import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import type { BookStats } from '@/types/bookStats';

interface BookStatsCardProps {
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

export function BookStatsCard({ stats }: BookStatsCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('bookDetail.readingStats')}</ThemedText>
      <View style={styles.grid}>
        <StatItem label={t('bookDetail.totalSessions')} value={String(stats.totalSessions)} />
        <StatItem
          label={t('bookDetail.totalMinutes')}
          value={String(stats.totalMinutes)}
        />
        <StatItem
          label={t('bookDetail.totalPagesRead')}
          value={String(stats.totalPagesRead)}
        />
        <StatItem
          label={t('bookDetail.avgPages')}
          value={String(stats.averagePagesPerSession)}
        />
        <StatItem
          label={t('bookDetail.avgMinutes')}
          value={String(stats.averageMinutesPerSession)}
        />
        <StatItem
          label={t('bookDetail.bestSessionPages')}
          value={String(stats.bestSessionPages)}
        />
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
});
