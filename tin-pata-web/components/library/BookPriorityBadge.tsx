import type { BookPriority } from '@/types/book';
import { formatPriorityLabel } from '@/types/book';

const PRIORITY_STYLES: Record<BookPriority, string> = {
  low: 'border-border text-muted',
  normal: 'border-border text-foreground',
  high: 'border-tint/40 bg-tint-muted text-tint',
};

interface BookPriorityBadgeProps {
  priority: BookPriority;
  className?: string;
}

export function BookPriorityBadge({ priority, className = '' }: BookPriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]} ${className}`}
    >
      {formatPriorityLabel(priority)}
    </span>
  );
}
