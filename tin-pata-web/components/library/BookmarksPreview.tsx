import type { Bookmark } from '@/types/bookmark';
import { formatDate } from '@/utils/date';

interface BookmarksPreviewProps {
  bookmarks: Bookmark[];
  totalCount: number;
}

export function BookmarksPreview({ bookmarks, totalCount }: BookmarksPreviewProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Bookmarks</h2>
          <p className="mt-1 text-sm text-muted">
            {totalCount} total · latest preview
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Full bookmark list comes later"
          className="text-xs font-medium text-tint opacity-60"
        >
          View all
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No bookmarks yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="rounded-lg bg-background/80 px-3 py-2.5">
              <p className="text-sm font-medium text-foreground">
                {bookmark.title?.trim() || `Page ${bookmark.pageNumber}`}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Page {bookmark.pageNumber} · {formatDate(bookmark.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
