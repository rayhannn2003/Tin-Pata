import type { SyncStatusState } from '@/utils/dashboard';

const LABELS: Record<SyncStatusState, string> = {
  synced: 'Synced',
  syncing: 'Syncing…',
  offline: 'Offline',
  conflict: 'Conflict',
};

const DOT: Record<SyncStatusState, string> = {
  synced: 'bg-tint',
  syncing: 'bg-amber-500',
  offline: 'bg-muted',
  conflict: 'bg-red-500',
};

interface SyncStatusProps {
  status?: SyncStatusState;
  /** Compact for sidebar / top bar */
  compact?: boolean;
  className?: string;
}

/** UI-only sync indicator — no sync logic in v2.1C. */
export function SyncStatus({ status = 'synced', compact = false, className = '' }: SyncStatusProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-sm text-muted ${className}`}
      role="status"
      aria-label={`Sync status: ${LABELS[status]}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[status]}`} aria-hidden />
      {!compact ? <span>{LABELS[status]}</span> : null}
      {compact ? <span className="sr-only">{LABELS[status]}</span> : null}
    </div>
  );
}
