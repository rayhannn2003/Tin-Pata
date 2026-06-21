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
  taskQueue: Promise<unknown>;
  activeDepth: number;
  /** Bumped on dev fast refresh so callers can re-init stale connections. */
  epoch: number;
};

function getState(): DbState {
  const g = globalThis as typeof globalThis & { [DB_STATE_KEY]?: DbState };
  if (!g[DB_STATE_KEY]) {
    g[DB_STATE_KEY] = {
      instance: null,
      openPromise: null,
      initPromise: null,
      taskQueue: Promise.resolve(),
      activeDepth: 0,
      epoch: 0,
    };
  }
  return g[DB_STATE_KEY];
}

function isStaleDbError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('already released') ||
    message.includes('nativestatement') ||
    message.includes('database is locked') ||
    message.includes('prepareasync')
  );
}

function invalidateConnection(state: DbState): void {
  state.instance = null;
  state.openPromise = null;
  state.initPromise = null;
}

// Fast refresh re-runs this module — drop stale JS handles without closeAsync
// (native SharedObjects may already be released; closing races in-flight work).
if (__DEV__) {
  const state = getState();
  state.epoch += 1;
  invalidateConnection(state);
  state.activeDepth = 0;
  state.taskQueue = state.taskQueue.catch(() => undefined);
}

export const isDatabaseNative = true;

export function getDatabaseEpoch(): number {
  return getState().epoch;
}

async function openDatabaseConnection(): Promise<SQLiteDatabase> {
  const state = getState();

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

async function executeDatabaseTask<T>(
  operation: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const state = getState();
  const startEpoch = state.epoch;
  const maxAttempts = __DEV__ ? 3 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const db = await openDatabaseConnection();
      if (__DEV__ && startEpoch !== state.epoch) {
        invalidateConnection(state);
        continue;
      }
      return await operation(db);
    } catch (error) {
      if (__DEV__ && attempt < maxAttempts - 1 && isStaleDbError(error)) {
        invalidateConnection(state);
        continue;
      }
      throw error;
    }
  }

  throw new Error('Database operation failed after retries.');
}

/** Serializes SQLite work — expo-sqlite rejects overlapping async statements on one connection. */
export function withDatabase<T>(
  operation: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const state = getState();

  const run = (): Promise<T> => {
    state.activeDepth += 1;
    return executeDatabaseTask(operation).finally(() => {
      state.activeDepth -= 1;
    });
  };

  if (state.activeDepth > 0) {
    return run();
  }

  const task = state.taskQueue.then(run);
  state.taskQueue = task.catch(() => undefined);
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

/** Applies MIGRATIONS in version order; each version runs at most once. */
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
      migration.version,
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
    invalidateConnection(state);
  }
}
