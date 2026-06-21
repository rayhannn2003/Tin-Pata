import { withDatabase } from '@/db/database';
import type { Setting } from '@/types';

interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

function mapRow(row: SettingRow): Setting {
  return {
    key: row.key,
    value: row.value,
    updatedAt: row.updated_at,
  };
}

export const SettingsRepository = {
  async get(key: string): Promise<string | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<SettingRow>(
        'SELECT * FROM settings WHERE key = ?',
        key,
      );
      return row?.value ?? null;
    });
  },

  async set(key: string, value: string): Promise<void> {
    await withDatabase(async (db) => {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        key,
        value,
        now,
      );
    });

    const { SyncEnqueueService, isApplyingRemoteSync } = await import('@/services/SyncEnqueueService');
    if (!isApplyingRemoteSync()) {
      await SyncEnqueueService.onSettingChanged(key, value);
    }
  },

  async getAll(): Promise<Setting[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<SettingRow>(
        'SELECT * FROM settings ORDER BY key ASC',
      );
      return rows.map(mapRow);
    });
  },

  async deleteAll(): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM settings');
    });
  },
};
