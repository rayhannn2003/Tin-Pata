import { HabitCalendar } from '@/components/dashboard/DashboardWidgets';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LinkedEmptyState } from '@/components/dashboard/LinkedEmptyState';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { AnalyticsService } from '@/services/AnalyticsService';
import { BookService } from '@/services/BookService';
import { ROUTES } from '@/utils/constants';

export default async function AnalyticsPage() {
  const books = await BookService.listForCurrentUser();
  const [allTime, weekly, streak, insightData] = await Promise.all([
    AnalyticsService.getAllTimeStats(),
    AnalyticsService.getWeeklyStats(7),
    AnalyticsService.getStreak(365),
    AnalyticsService.getInsights(books),
  ]);

  const hasData = allTime.totalSessions > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardHeader
        title="Analytics"
        description="Streaks, weekly habits, and reading insights from the same cloud data as the mobile app."
      />

      {!hasData ? (
        <SectionCard title="Reading insights">
          <LinkedEmptyState
            title="No analytics yet"
            description="Finish a reading session in the web or mobile reader to see stats here."
            href={ROUTES.library}
            actionLabel="Go to library"
          />
        </SectionCard>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Today</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Pages" value={String(allTime.todayPages)} />
              <StatCard label="Minutes" value={String(allTime.todayMinutes)} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">This week</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard label="Pages" value={String(weekly.totalPagesThisWeek)} />
              <StatCard label="Minutes" value={String(weekly.totalMinutesThisWeek)} />
              <StatCard label="Reading days" value={String(weekly.readingDaysThisWeek)} />
              <StatCard label="Goals met" value={String(weekly.completedGoalDaysThisWeek)} />
              <StatCard label="Current streak" value={String(streak.currentStreak)} />
              <StatCard label="Longest streak" value={String(streak.longestStreak)} />
            </div>
            {weekly.bestReadingDay ? (
              <p className="text-sm text-muted">
                Best day: {weekly.bestReadingDay.label} with {weekly.bestReadingDay.pagesRead}{' '}
                pages.
              </p>
            ) : null}
          </section>

          <SectionCard title="Habit calendar" description="Last 7 days.">
            <HabitCalendar days={weekly.habitCalendar} />
          </SectionCard>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">All time</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Sessions" value={String(allTime.totalSessions)} />
              <StatCard label="Minutes" value={String(allTime.totalMinutes)} />
              <StatCard label="Total pages" value={String(allTime.totalPages)} />
            </div>
          </section>

          <SectionCard title="Insights" description="Patterns from your sessions.">
            <dl className="grid gap-3 sm:grid-cols-2">
              <InsightRow
                label="Best reading day"
                value={
                  insightData.bestReadingDay
                    ? `${insightData.bestReadingDay.dateKey} · ${insightData.bestReadingDay.pagesRead} pages`
                    : '—'
                }
              />
              <InsightRow
                label="Avg pages / session"
                value={String(insightData.averagePagesPerSession)}
              />
              <InsightRow
                label="Avg minutes / session"
                value={String(insightData.averageMinutesPerSession)}
              />
              <InsightRow
                label="Longest session"
                value={`${insightData.longestSessionMinutes} min`}
              />
              <InsightRow label="Most-read book" value={insightData.mostReadBookTitle ?? '—'} />
            </dl>
          </SectionCard>
        </>
      )}
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/80 px-3 py-2.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
