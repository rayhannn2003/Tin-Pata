import type { BookStatus } from '@/types/book';
import { formatStatusLabel } from '@/types/book';

const STATUS_STYLES: Record<BookStatus, string> = {
  not_started: 'bg-border/60 text-muted',
  reading: 'bg-tint-muted text-tint',
  paused: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  finished: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
};

interface BookStatusBadgeProps {
  status: BookStatus;
  className?: string;
}

export function BookStatusBadge({ status, className = '' }: BookStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]} ${className}`}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
