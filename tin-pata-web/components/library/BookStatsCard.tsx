import type { BookReadingStats } from '@/types/book';
import { formatDate } from '@/utils/date';

interface BookStatsCardProps {
  stats: BookReadingStats;
}

export function BookStatsCard({ stats }: BookStatsCardProps) {
  const items = [
    { label: 'Total sessions', value: String(stats.totalSessions) },
    { label: 'Total minutes', value: String(stats.totalMinutes) },
    { label: 'Total pages read', value: String(stats.totalPagesRead) },
    { label: 'Avg pages / session', value: String(stats.averagePagesPerSession) },
    { label: 'Avg minutes / session', value: String(stats.averageMinutesPerSession) },
    { label: 'Longest session', value: `${stats.longestSessionMinutes} min` },
    {
      label: 'First read',
      value: stats.firstReadAt ? formatDate(stats.firstReadAt) : '—',
    },
    {
      label: 'Last read',
      value: stats.lastReadAt ? formatDate(stats.lastReadAt) : '—',
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Statistics</h2>
      <p className="mt-1 text-sm text-muted">From synced reading sessions</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg bg-background/80 px-3 py-2.5">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
