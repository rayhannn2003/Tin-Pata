import {
  openDatabaseAsync,
  type SQLiteDatabase,
  type SQLiteOpenOptions,
} from 'expo-sqlite';

import { MIGRATIONS } from '@/db/migrations';

const DATABASE_NAME = 'reading-habit.db';
const DB_STATE_KEY = '__tin_pata_sqlite_state__';

type DbState = {
  instance: SQLiteDatabase | null;
  openPromise: Promise<SQLiteDatabase> | null;
  initPromise: Promise<void> | null;
};

function getState(): DbState {
  const g = globalThis as typeof globalThis & { [DB_STATE_KEY]?: DbState };
  if (!g[DB_STATE_KEY]) {
    g[DB_STATE_KEY] = {
      instance: null,
      openPromise: null,
      initPromise: null,
    };
  }
  return g[DB_STATE_KEY];
}

// Fast refresh re-runs this module while globalThis may still hold a SQLite handle
// whose native SharedObject was released — clear it before any query runs.
if (__DEV__) {
  const state = getState();
  state.instance = null;
  state.openPromise = null;
  state.initPromise = null;
}

const OPEN_OPTIONS: SQLiteOpenOptions = __DEV__ ? { useNewConnection: true } : {};

export const isDatabaseNative = true;

export async function getDatabase(): Promise<SQLiteDatabase> {
  const state = getState();

  if (state.instance) {
    return state.instance;
  }

  if (!state.openPromise) {
    state.openPromise = openDatabaseAsync(DATABASE_NAME, OPEN_OPTIONS)
      .then((db) => {
        state.instance = db;
        return db;
      })
      .finally(() => {
        state.openPromise = null;
      });
  }

  return state.openPromise;
}

export async function initializeDatabase(): Promise<void> {
  const state = getState();

  if (state.initPromise) {
    return state.initPromise;
  }

  state.initPromise = runMigrations().catch((error) => {
    state.initPromise = null;
    throw error;
  });

  return state.initPromise;
}

async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     INTEGER PRIMARY KEY NOT NULL,
      applied_at  TEXT NOT NULL
    );
  `);

  for (const migration of MIGRATIONS) {
    const applied = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [migration.version],
    );

    if (applied) {
      continue;
    }

    await db.execAsync(migration.sql);
    await db.runAsync(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      [migration.version, new Date().toISOString()],
    );
  }
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    DELETE FROM reflections;
    DELETE FROM notes;
    DELETE FROM bookmarks;
    DELETE FROM reading_sessions;
    DELETE FROM books;
    DELETE FROM daily_goals;
    DELETE FROM settings;
  `);
}

export async function closeDatabase(): Promise<void> {
  const state = getState();

  if (state.instance) {
    await state.instance.closeAsync();
    state.instance = null;
    state.initPromise = null;
  }
}
