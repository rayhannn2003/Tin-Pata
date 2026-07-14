'use client';

import { useMemo, useState } from 'react';

import type { ReaderCheckpoint } from '@/types/checkpoint';
import { formatDateTime, formatRelativeTime } from '@/utils/date';

interface ReaderCheckpointsProps {
  checkpoints: ReaderCheckpoint[];
  currentPage: number;
  onJump: (page: number) => void;
  onDelete: (id: string) => void;
  onStartDraw: () => void;
  drawMode: boolean;
}

export function ReaderCheckpoints({
  checkpoints,
  currentPage,
  onJump,
  onDelete,
  onStartDraw,
  drawMode,
}: ReaderCheckpointsProps) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return checkpoints;
    return checkpoints.filter((cp) => {
      const stamp = formatDateTime(cp.createdAt).toLowerCase();
      return stamp.includes(q) || String(cp.pageNumber).includes(q);
    });
  }, [checkpoints, query]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-2 border-b border-border p-2">
        <button
          type="button"
          onClick={onStartDraw}
          aria-pressed={drawMode}
          className={`w-full rounded-md px-3 py-2 text-sm font-medium ${
            drawMode ? 'bg-tint text-white' : 'bg-tint-muted text-tint hover:opacity-90'
          }`}
        >
          {drawMode ? 'Drawing… (Esc to cancel)' : 'Draw checkpoint line'}
        </button>
        <label className="block">
          <span className="sr-only">Search checkpoints</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by page or date…"
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-tint/30"
          />
        </label>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-muted">
            No checkpoints yet. Draw a line where you stopped reading.
          </li>
        ) : (
          filtered.map((cp) => (
            <li key={cp.id}>
              <div
                className={`group flex items-start gap-1 rounded-md ${
                  cp.pageNumber === currentPage ? 'bg-tint-muted' : 'hover:bg-tint-muted/60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onJump(cp.pageNumber)}
                  className="min-w-0 flex-1 px-2 py-2 text-left"
                >
                  <p className="text-sm font-medium text-foreground">Page {cp.pageNumber}</p>
                  <p className="truncate text-xs text-muted" title={formatDateTime(cp.createdAt)}>
                    {formatDateTime(cp.createdAt)}
                    <span className="mx-1 opacity-50">·</span>
                    {formatRelativeTime(cp.createdAt)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cp.id)}
                  className="mr-1 mt-1 rounded px-1.5 py-1 text-xs text-muted opacity-0 hover:bg-background hover:text-foreground group-hover:opacity-100"
                  aria-label={`Delete checkpoint on page ${cp.pageNumber}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
