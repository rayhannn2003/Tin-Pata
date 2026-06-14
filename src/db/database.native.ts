import {
  openDatabaseAsync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import { MIGRATIONS } from '@/db/migrations';

const DATABASE_NAME = 'reading-habit.db';
const DB_STATE_KEY = '__tin_pata_sqlite_state__';

type DbState = {
  instance: SQLiteDatabase | null;
  openPromise: Promise<SQLiteDatabase> | null;
  initPromise: Promise<void> | null;
  closePromise: Promise<void> | null;
  taskQueue: Promise<unknown>;
  activeDepth: number;
};

function getState(): DbState {
  const g = globalThis as typeof globalThis & { [DB_STATE_KEY]?: DbState };
  if (!g[DB_STATE_KEY]) {
    g[DB_STATE_KEY] = {
      instance: null,
      openPromise: null,
      initPromise: null,
      closePromise: null,
      taskQueue: Promise.resolve(),
      activeDepth: 0,
    };
  }
  return g[DB_STATE_KEY];
}

// Fast refresh re-runs this module — close the previous native handle before reopening.
if (__DEV__) {
  const state = getState();
  const stale = state.instance;
  state.instance = null;
  state.openPromise = null;
  state.initPromise = null;
  if (stale) {
    state.closePromise = stale.closeAsync().catch(() => {
      // Ignore close errors during hot reload.
    });
  }
}

export const isDatabaseNative = true;

async function openDatabaseConnection(): Promise<SQLiteDatabase> {
  const state = getState();

  if (state.closePromise) {
    await state.closePromise;
    state.closePromise = null;
  }

  if (state.instance) {
    return state.instance;
  }

  if (!state.openPromise) {
    state.openPromise = openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        await db.execAsync('PRAGMA foreign_keys = ON;');
        await db.execAsync('PRAGMA busy_timeout = 5000;');
        await db.execAsync('PRAGMA journal_mode = WAL;');
        state.instance = db;
        return db;
      })
      .finally(() => {
        state.openPromise = null;
      });
  }

  return state.openPromise;
}

/** Serializes SQLite work — expo-sqlite rejects overlapping async statements on one connection. */
export function withDatabase<T>(
  operation: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const state = getState();

  const run = async (): Promise<T> => {
    state.activeDepth += 1;
    try {
      const db = await openDatabaseConnection();
      return await operation(db);
    } finally {
      state.activeDepth -= 1;
    }
  };

  if (state.activeDepth > 0) {
    return run();
  }

  const task = state.taskQueue.then(run);
  state.taskQueue = task.catch(() => {});
  return task;
}

/** Prefer {@link withDatabase} so reads/writes do not overlap on the shared connection. */
export async function getDatabase(): Promise<SQLiteDatabase> {
  return withDatabase(async (db) => db);
}

export async function initializeDatabase(): Promise<void> {
  const state = getState();

  if (state.initPromise) {
    return state.initPromise;
  }

  state.initPromise = withDatabase(runMigrations).catch((error) => {
    state.initPromise = null;
    throw error;
  });

  return state.initPromise;
}

async function runMigrations(db: SQLiteDatabase): Promise<void> {
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
      migration.version,
      new Date().toISOString(),
    );
  }
}

export async function resetDatabase(): Promise<void> {
  await withDatabase(async (db) => {
    await db.execAsync(`
      DELETE FROM reflections;
      DELETE FROM notes;
      DELETE FROM bookmarks;
      DELETE FROM reading_sessions;
      DELETE FROM books;
      DELETE FROM daily_goals;
      DELETE FROM settings;
    `);
  });
}

export async function closeDatabase(): Promise<void> {
  const state = getState();

  await state.taskQueue;

  if (state.instance) {
    await state.instance.closeAsync();
    state.instance = null;
    state.initPromise = null;
  }
}
