import type { ReadingSession } from '@/types/session';
import { formatDate } from '@/utils/date';

interface RecentSessionsCardProps {
  sessions: ReadingSession[];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

export function RecentSessionsCard({ sessions }: RecentSessionsCardProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-base font-semibold text-foreground">Recent sessions</h2>
      <p className="mt-1 text-sm text-muted">Read-only preview — no editing yet</p>

      {sessions.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No reading sessions synced for this book yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{formatDate(session.createdAt)}</p>
                <p className="text-xs text-muted">
                  {formatDuration(session.durationSeconds)} · {session.pagesRead} pages
                  {session.startPage || session.endPage
                    ? ` · p. ${session.startPage}–${session.endPage}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted">
                {session.mood ? (
                  <span className="rounded-md bg-background px-2 py-1 ring-1 ring-border">
                    Mood: {session.mood}
                  </span>
                ) : null}
                {session.focusLevel != null ? (
                  <span className="rounded-md bg-background px-2 py-1 ring-1 ring-border">
                    Focus: {session.focusLevel}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
