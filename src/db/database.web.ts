/**
 * Web stub — expo-sqlite on web requires a separate WASM/Metro setup.
 * This app is mobile-first; use Expo Go on a device for full functionality.
 */
export const isDatabaseNative = false;

export async function getDatabase(): Promise<never> {
  throw new Error(
    'SQLite is available on iOS and Android only. Open this app in Expo Go on your phone.',
  );
}

export async function withDatabase<T>(
  _operation: (db: never) => Promise<T>,
): Promise<T> {
  return getDatabase();
}

export function getDatabaseEpoch(): number {
  return 0;
}

export async function initializeDatabase(): Promise<void> {
  // No-op: allow UI preview in the browser without loading expo-sqlite WASM.
}

export async function resetDatabase(): Promise<void> {
  // No-op on web preview.
}

export async function closeDatabase(): Promise<void> {
  // No-op on web preview.
}
