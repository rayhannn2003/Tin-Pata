import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppEmptyState } from '@/components/common/AppEmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { HabitCalendar } from '@/components/stats/HabitCalendar';
import { HideScreenHeader } from '@/components/ui/HideScreenHeader';
import { Card } from '@/components/ui/Card';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ThemedText } from '@/components/ui/ThemedText';
import { useStreak } from '@/features/streaks/useStreak';
import { useWeeklyStats } from '@/features/stats/useWeeklyStats';
import { useReadingStats } from '@/features/sessions/useReadingStats';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <ThemedText variant="label" secondary>
        {label}
      </ThemedText>
      <ThemedText variant="title" style={styles.statValue}>
        {value}
      </ThemedText>
    </Card>
  );
}

export default function StatsScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { stats, loading: statsLoading } = useReadingStats();
  const { streak, loading: streakLoading } = useStreak();
  const { weekly, loading: weeklyLoading } = useWeeklyStats();

  const loading = statsLoading || streakLoading || weeklyLoading;
  const hasData = stats.totalSessions > 0;

  return (
    <>
      <HideScreenHeader />
      <ScreenContainer>
        <ThemedText secondary style={styles.intro}>
          {t('stats.intro')}
        </ThemedText>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} />
            <ThemedText variant="caption" secondary>
              {t('stats.loading')}
            </ThemedText>
          </View>
        ) : !hasData ? (
          <AppEmptyState title={t('stats.emptyTitle')} message={t('stats.emptyMessage')} />
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title={t('stats.today')} />
              <View style={styles.row}>
                <StatCard label={t('stats.pages')} value={String(stats.todayPages)} />
                <StatCard label={t('stats.minutes')} value={String(stats.todayMinutes)} />
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('stats.thisWeek')} />
              <View style={styles.row}>
                <StatCard label={t('stats.pages')} value={String(weekly.totalPagesThisWeek)} />
                <StatCard label={t('stats.minutes')} value={String(weekly.totalMinutesThisWeek)} />
              </View>
              <View style={styles.row}>
                <StatCard label={t('stats.readingDays')} value={String(weekly.readingDaysThisWeek)} />
                <StatCard
                  label={t('stats.goalsMet')}
                  value={String(weekly.completedGoalDaysThisWeek)}
                />
              </View>
              {weekly.bestReadingDay ? (
                <Card muted style={styles.noteCard}>
                  <ThemedText variant="caption" secondary>
                    {t('stats.bestDay', {
                      label: weekly.bestReadingDay.label,
                      pages: weekly.bestReadingDay.pagesRead,
                    })}
                  </ThemedText>
                </Card>
              ) : null}
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('stats.streak')} />
              <View style={styles.row}>
                <StatCard label={t('stats.current')} value={String(streak.currentStreak)} />
                <StatCard label={t('stats.longest')} value={String(streak.longestStreak)} />
              </View>
              <Card muted style={styles.noteCard}>
                <ThemedText variant="caption" style={{ color: colors.tint }}>
                  {streak.recoveryMessage}
                </ThemedText>
              </Card>
            </View>

            <View style={styles.section}>
              <HabitCalendar days={weekly.habitCalendar} />
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('stats.allTime')} />
              <View style={styles.row}>
                <StatCard label={t('stats.sessions')} value={String(stats.totalSessions)} />
                <StatCard label={t('stats.minutes')} value={String(stats.totalMinutes)} />
              </View>
              <StatCard label={t('stats.totalPages')} value={String(stats.totalPages)} />
            </View>
          </>
        )}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: Spacing.xl, lineHeight: 22 },
  section: { marginBottom: Spacing.xl, gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.md },
  statCard: { flex: 1, gap: Spacing.sm },
  statValue: { fontSize: 32 },
  noteCard: { gap: 6 },
  centered: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
