import * as SQLite from 'expo-sqlite';

import { MIGRATIONS } from '@/db/migrations';

const DATABASE_NAME = 'reading-habit.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const isDatabaseNative = true;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
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
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
