import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppEmptyState } from '@/components/common/AppEmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { ContinueReadingCard } from '@/components/home/ContinueReadingCard';
import { GoalProgressCard } from '@/components/home/GoalProgressCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { ReaderBlockRescueCard } from '@/components/home/ReaderBlockRescueCard';
import { StreakCard } from '@/components/home/StreakCard';
import { HabitCalendar } from '@/components/stats/HabitCalendar';
import { SessionSummaryCard } from '@/components/stats/SessionSummaryCard';
import { HideScreenHeader } from '@/components/ui/HideScreenHeader';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useBookCount } from '@/features/books/useBookCount';
import { useContinueReading } from '@/features/books/useContinueReading';
import { useGoalProgress } from '@/features/goals/useGoalProgress';
import { useStreak } from '@/features/streaks/useStreak';
import { useWeeklyStats } from '@/features/stats/useWeeklyStats';
import { useTodayReadingSummary } from '@/features/sessions/useTodayReadingSummary';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { summary } = useTodayReadingSummary();
  const { progress, loading: goalLoading } = useGoalProgress();
  const { streak, loading: streakLoading } = useStreak();
  const { weekly, loading: weeklyLoading } = useWeeklyStats();
  const { book: continueBook, loading: continueLoading } = useContinueReading();
  const { hasBooks, loading: bookCountLoading } = useBookCount();

  const statsLoading = goalLoading || streakLoading || weeklyLoading;

  return (
    <>
      <HideScreenHeader />
      <ScreenContainer>
        <HomeHeader />

        <View style={styles.section}>
          <SectionHeader
            title={t('home.continueReading')}
            subtitle={t('home.continueSubtitle')}
          />
          {continueLoading || bookCountLoading ? (
            <ActivityIndicator color={colors.tint} />
          ) : continueBook ? (
            <ContinueReadingCard book={continueBook} />
          ) : !hasBooks ? (
            <AppEmptyState
              title={t('home.emptyShelfTitle')}
              message={t('home.emptyShelfMessage')}
              actionLabel={t('home.emptyShelfAction')}
              onAction={() => router.push('/library')}
            />
          ) : (
            <AppEmptyState
              title={t('home.noBookInProgressTitle')}
              message={t('home.noBookInProgressMessage')}
              actionLabel={t('home.goToLibrary')}
              onAction={() => router.push('/library')}
            />
          )}
        </View>

        {statsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.tint} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title={t('home.todayGoal')} />
              <GoalProgressCard progress={progress} />
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('home.streak')} />
              <StreakCard streak={streak} />
            </View>
          </>
        )}

        <View style={styles.section}>
          <ReaderBlockRescueCard />
        </View>

        {!statsLoading ? (
          <>
            <View style={styles.section}>
              <HabitCalendar days={weekly.habitCalendar} />
            </View>

            <View style={styles.section}>
              <SectionHeader title={t('home.today')} subtitle={t('home.todaySubtitle')} />
              <SessionSummaryCard summary={summary} />
            </View>
          </>
        ) : null}
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.xl, gap: Spacing.sm },
  centered: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
