export type SyncStatusState = 'synced' | 'syncing' | 'offline' | 'conflict';

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getDisplayNameFromEmail(email: string | null | undefined): string {
  if (!email) {
    return 'Reader';
  }
  const local = email.split('@')[0]?.trim();
  if (!local) {
    return 'Reader';
  }
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function formatTopbarDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function initialsFromEmail(email: string | null | undefined): string {
  if (!email) {
    return '?';
  }
  return email.charAt(0).toUpperCase();
}
