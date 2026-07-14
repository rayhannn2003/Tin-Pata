import { progressPercent } from '@/types/book';

interface BookProgressProps {
  currentPage: number;
  totalPages: number;
  showLabel?: boolean;
  className?: string;
}

export function BookProgress({
  currentPage,
  totalPages,
  showLabel = true,
  className = '',
}: BookProgressProps) {
  const percent = progressPercent(currentPage, totalPages);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {showLabel ? (
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>{percent}%</span>
          <span>
            p. {currentPage}
            {totalPages > 0 ? ` / ${totalPages}` : ''}
          </span>
        </div>
      ) : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress ${percent} percent`}
      >
        <div
          className="h-full rounded-full bg-tint transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
