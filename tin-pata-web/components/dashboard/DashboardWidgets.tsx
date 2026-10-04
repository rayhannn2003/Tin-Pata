import Link from 'next/link';

import type { HabitCalendarDay } from '@/types/analytics';

const STATUS_CLASS: Record<HabitCalendarDay['status'], string> = {
  completed: 'bg-tint text-white',
  partial: 'bg-tint-muted text-tint',
  empty: 'bg-background text-muted border border-border',
};

interface HabitCalendarProps {
  days: HabitCalendarDay[];
}

export function HabitCalendar({ days }: HabitCalendarProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => (
        <div key={day.dateKey} className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-wide text-muted">{day.label}</span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium ${STATUS_CLASS[day.status]}`}
            title={`${day.dateKey}: ${day.status}`}
          >
            {day.status === 'completed' ? '✓' : day.status === 'partial' ? '·' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ContinueReadingCardProps {
  bookId: string;
  title: string;
  author: string | null;
  currentPage: number;
  totalPages: number;
  percent: number;
  coverUrl?: string | null;
}

export function ContinueReadingCard({
  bookId,
  title,
  author,
  currentPage,
  totalPages,
  percent,
  coverUrl,
}: ContinueReadingCardProps) {
  return (
    <Link
      href={`/dashboard/reader/${bookId}`}
      className="flex gap-4 rounded-xl border border-border bg-background/70 p-4 transition hover:border-tint/40 hover:bg-tint-muted/40"
    >
      <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-tint-muted to-border/40">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xl font-semibold text-tint">
            {title.trim().charAt(0).toUpperCase() || 'B'}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{title}</p>
        {author ? <p className="truncate text-sm text-muted">{author}</p> : null}
        <p className="mt-2 text-xs text-muted">
          Page {currentPage}
          {totalPages > 0 ? ` of ${totalPages}` : ''} · {percent}%
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
          <div className="h-full rounded-full bg-tint" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </Link>
  );
}
