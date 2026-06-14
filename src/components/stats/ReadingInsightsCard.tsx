import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import type { ReadingInsights } from '@/types/insights';
import { formatDayLabel, parseDateKey } from '@/utils/date';
import { formatImportDate } from '@/utils/format';

interface ReadingInsightsCardProps {
  insights: ReadingInsights;
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText variant="caption" secondary style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText variant="caption" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

function formatBestDayLabel(dateKey: string, pagesRead: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const date = parseDateKey(dateKey);
  const formatted = formatImportDate(date.toISOString());
  const day = formatDayLabel(dateKey);
  return t('insights.bestDayValue', { day, date: formatted, pages: pagesRead });
}

export function ReadingInsightsCard({ insights }: ReadingInsightsCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      {insights.bestReadingDay ? (
        <InsightRow
          label={t('insights.bestReadingDay')}
          value={formatBestDayLabel(insights.bestReadingDay.dateKey, insights.bestReadingDay.pagesRead, t)}
        />
      ) : null}

      {insights.bestTimeRangeKey ? (
        <InsightRow
          label={t('insights.bestTimeRange')}
          value={t(insights.bestTimeRangeKey)}
        />
      ) : null}

      <InsightRow
        label={t('insights.avgSessionDuration')}
        value={t('insights.minutesValue', { count: insights.averageSessionDurationMinutes })}
      />

      <InsightRow
        label={t('insights.avgPagesPerSession')}
        value={String(insights.averagePagesPerSession)}
      />

      <InsightRow
        label={t('insights.totalReadingDays')}
        value={String(insights.totalReadingDays)}
      />

      {insights.longestSessionMinutes > 0 ? (
        <InsightRow
          label={t('insights.longestSession')}
          value={t('insights.longestSessionValue', {
            minutes: insights.longestSessionMinutes,
            pages: insights.longestSessionPages,
          })}
        />
      ) : null}

      {insights.mostReadBook ? (
        <InsightRow
          label={t('insights.mostReadBook')}
          value={t('insights.mostReadBookValue', {
            title: insights.mostReadBook.title,
            pages: insights.mostReadBook.pagesRead,
          })}
        />
      ) : null}

      {insights.mostCommonMoodKey ? (
        <InsightRow label={t('insights.mostCommonMood')} value={t(insights.mostCommonMoodKey)} />
      ) : null}

      {insights.mostCommonFocusKey ? (
        <InsightRow label={t('insights.mostCommonFocus')} value={t(insights.mostCommonFocusKey)} />
      ) : null}

      {insights.mostCommonBlockerKey ? (
        <InsightRow
          label={t('insights.mostCommonBlocker')}
          value={t(insights.mostCommonBlockerKey)}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  label: { flex: 1 },
  value: { flex: 1, textAlign: 'right' },
});
