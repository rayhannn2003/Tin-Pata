/** Shared last-write-wins helpers for sync conflict resolution. */

export function parseIsoMs(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/** Remote wins when its timestamp is >= local (ties go to remote for convergence). */
export function isRemoteNewer(
  localUpdatedAt: string | null | undefined,
  remoteUpdatedAt: string | null | undefined,
): boolean {
  const remoteMs = parseIsoMs(remoteUpdatedAt);
  if (remoteMs === null) {
    return false;
  }
  const localMs = parseIsoMs(localUpdatedAt);
  if (localMs === null) {
    return true;
  }
  return remoteMs >= localMs;
}

export function friendlySyncError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('failed to fetch') ||
    lower.includes('timeout')
  ) {
    return 'Could not reach the server. Check your internet connection and try again.';
  }
  if (lower.includes('jwt') || lower.includes('session')) {
    return 'Your sign-in session may have expired. Sign out and sign in again.';
  }
  if (lower.includes('row-level security') || lower.includes('permission')) {
    return 'Cloud sync permission error. Make sure your account data is linked.';
  }
  return message.length > 200 ? `${message.slice(0, 200)}…` : message;
}
