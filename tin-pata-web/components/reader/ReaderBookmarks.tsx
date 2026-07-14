'use client';

import type { Bookmark } from '@/types/bookmark';
import { formatDate } from '@/utils/date';

interface ReaderBookmarksProps {
  bookmarks: Bookmark[];
  currentPage: number;
  onJump: (page: number) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  showTitle?: boolean;
}

export function ReaderBookmarks({
  bookmarks,
  currentPage,
  onJump,
  onDelete,
  onCreate,
  showTitle = false,
}: ReaderBookmarksProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        {showTitle ? <h2 className="text-sm font-semibold text-foreground">Bookmarks</h2> : <span />}
        <button
          type="button"
          onClick={onCreate}
          className="text-xs font-medium text-tint hover:underline"
        >
          Add bookmark
        </button>
      </div>
      <div className="border-b border-border px-3 py-2">
        <label htmlFor="bm-search" className="sr-only">
          Search bookmarks
        </label>
        <input
          id="bm-search"
          type="search"
          disabled
          placeholder="Search (soon)"
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-muted opacity-60"
        />
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {bookmarks.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-muted">No bookmarks yet</li>
        ) : (
          bookmarks.map((bm) => (
            <li key={bm.id}>
              <div
                className={`group flex items-start gap-2 rounded-md px-2 py-2 ${
                  bm.pageNumber === currentPage ? 'bg-tint-muted' : 'hover:bg-background'
                }`}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onJump(bm.pageNumber)}
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {bm.title || `Page ${bm.pageNumber}`}
                  </p>
                  <p className="text-xs text-muted">
                    p. {bm.pageNumber} · {formatDate(bm.createdAt)}
                  </p>
                </button>
                <button
                  type="button"
                  aria-label={`Delete bookmark ${bm.title || bm.pageNumber}`}
                  onClick={() => onDelete(bm.id)}
                  className="shrink-0 text-xs text-muted opacity-0 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                >
                  Del
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      <p className="border-t border-border px-3 py-2 text-[11px] text-muted">
        Highlights &amp; AI — later
      </p>
    </div>
  );
}
