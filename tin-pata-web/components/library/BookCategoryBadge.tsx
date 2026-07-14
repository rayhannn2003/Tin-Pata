import type { BookCategory } from '@/types/book';
import { formatCategoryLabel } from '@/types/book';

interface BookCategoryBadgeProps {
  category: BookCategory;
  className?: string;
}

export function BookCategoryBadge({ category, className = '' }: BookCategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-border ${className}`}
    >
      {formatCategoryLabel(category)}
    </span>
  );
}
