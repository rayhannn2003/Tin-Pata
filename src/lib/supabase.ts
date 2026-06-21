import 'react-native-url-polyfill/auto';

import { NativeModules, TurboModuleRegistry } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();

const memoryAuthStorage: AuthStorage = {
  getItem: async (key) => memoryStore.get(key) ?? null,
  setItem: async (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: async (key) => {
    memoryStore.delete(key);
  },
};

/** True when the dev build includes @react-native-async-storage/async-storage native code. */
export function isNativeAuthStorageAvailable(): boolean {
  const turbo = TurboModuleRegistry as {
    get?: (name: string) => unknown;
  } | null;

  if (turbo?.get?.('RNCAsyncStorage')) {
    return true;
  }
  if (turbo?.get?.('RNC_AsyncSQLiteDBStorage')) {
    return true;
  }
  if (turbo?.get?.('PlatformLocalStorage')) {
    return true;
  }

  return Boolean(
    NativeModules.RNCAsyncStorage ??
      NativeModules.RNC_AsyncSQLiteDBStorage ??
      NativeModules.PlatformLocalStorage ??
      NativeModules.AsyncSQLiteDBStorage ??
      NativeModules.AsyncLocalStorage,
  );
}

/** Env vars set and native AsyncStorage linked — required for persistent auth sessions. */
export function isSupabaseAuthReady(): boolean {
  return isSupabaseConfigured && isNativeAuthStorageAvailable();
}

function resolveAuthStorage(): AuthStorage {
  if (!isNativeAuthStorageAvailable()) {
    return memoryAuthStorage;
  }

  // Require only after native module check — avoids crash on old dev builds.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage')
    .default as AuthStorage;
  return AsyncStorage;
}

let client: SupabaseClient | null = null;

/** Lazy singleton — returns null when env vars are missing (local-only mode). */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: resolveAuthStorage(),
        autoRefreshToken: true,
        persistSession: isNativeAuthStorageAvailable(),
        detectSessionInUrl: false,
      },
    });
  }

  return client;
}
