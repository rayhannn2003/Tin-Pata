'use client';

import { progressPercent } from '@/types/book';

interface ReaderProgressProps {
  currentPage: number;
  totalPages: number;
}

export function ReaderProgress({ currentPage, totalPages }: ReaderProgressProps) {
  const percent = progressPercent(currentPage, totalPages);

  return (
    <div
      className="shrink-0 border-t border-border bg-surface px-4 py-2"
      role="status"
      aria-label={`Reading progress ${percent} percent`}
    >
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
        <span>
          Page {currentPage} / {totalPages || '—'}
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-tint transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
