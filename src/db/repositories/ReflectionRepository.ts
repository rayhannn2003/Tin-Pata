import { withDatabase } from '@/db/database';
import { getLocalWriteSyncFields } from '@/db/syncWriteHelpers';
import type { Reflection } from '@/types';
import { mapSyncFromRow } from '@/utils/syncMetadata';

interface ReflectionRow {
  id: string;
  text: string;
  book_id: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
  device_id: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
  deleted_at: string | null;
}

function mapRow(row: ReflectionRow): Reflection {
  return {
    id: row.id,
    text: row.text,
    bookId: row.book_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    ...mapSyncFromRow(row),
  };
}

export const ReflectionRepository = {
  async createReflection(reflection: Reflection): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      await db.runAsync(
        `INSERT INTO reflections (
          id, text, book_id, created_at,
          user_id, device_id, sync_status, last_synced_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        reflection.id,
        reflection.text,
        reflection.bookId,
        reflection.createdAt,
        reflection.userId ?? sync.userId,
        sync.deviceId,
        sync.syncStatus,
        reflection.lastSyncedAt,
        sync.updatedAt,
        null,
      );
    });
  },

  async getRecent(limit = 10): Promise<Reflection[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<ReflectionRow>(
        'SELECT * FROM reflections WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ?',
        limit,
      );
      return rows.map(mapRow);
    });
  },

  async getAll(): Promise<Reflection[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<ReflectionRow>(
        'SELECT * FROM reflections WHERE deleted_at IS NULL ORDER BY created_at DESC',
      );
      return rows.map(mapRow);
    });
  },

  async deleteReflection(id: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM reflections WHERE id = ?', id);
    });
  },
};
