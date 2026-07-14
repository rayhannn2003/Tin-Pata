const DEVICE_ID_KEY = 'tin-pata.device_id';

/** Stable browser device id for Supabase writes (device_id columns). */
export function getOrCreateWebDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'web-ssr';
  }
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)?.trim();
  if (existing) {
    return existing;
  }
  const id = `web-${crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
