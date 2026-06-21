import { withDatabase } from '@/db/database';
import type { SyncEntityType, SyncQueueItem, SyncQueueOperation, SyncQueueStatus } from '@/types/sync';
import { nowIso } from '@/utils/syncMetadata';

interface SyncQueueRow {
  id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncQueueOperation;
  payload: string | null;
  status: SyncQueueStatus;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: SyncQueueRow): SyncQueueItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    operation: row.operation,
    payload: row.payload,
    status: row.status,
    retryCount: row.retry_count,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const SyncQueueRepository = {
  async insert(item: Omit<SyncQueueItem, 'retryCount' | 'lastError' | 'createdAt' | 'updatedAt'> & {
    retryCount?: number;
    lastError?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }): Promise<void> {
    const now = nowIso();
    await withDatabase(async (db) => {
      await db.runAsync(
        `INSERT INTO sync_queue (
          id, entity_type, entity_id, operation, payload, status,
          retry_count, last_error, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        item.id,
        item.entityType,
        item.entityId,
        item.operation,
        item.payload,
        item.status,
        item.retryCount ?? 0,
        item.lastError ?? null,
        item.createdAt ?? now,
        item.updatedAt ?? now,
      );
    });
  },

  async removePendingForEntity(entityType: SyncEntityType, entityId: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync(
        `DELETE FROM sync_queue
         WHERE entity_type = ? AND entity_id = ? AND status IN ('pending', 'error')`,
        entityType,
        entityId,
      );
    });
  },

  async getPending(limit: number): Promise<SyncQueueItem[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<SyncQueueRow>(
        `SELECT * FROM sync_queue
         WHERE status IN ('pending', 'error')
         ORDER BY created_at ASC
         LIMIT ?`,
        limit,
      );
      return rows.map(mapRow);
    });
  },

  async countPending(): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`,
      );
      return row?.count ?? 0;
    });
  },

  async countFailed(): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'error'`,
      );
      return row?.count ?? 0;
    });
  },

  async countProcessing(): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'processing'`,
      );
      return row?.count ?? 0;
    });
  },

  async countSynced(): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sync_queue WHERE status = 'synced'`,
      );
      return row?.count ?? 0;
    });
  },

  async resetStuckProcessing(maxAgeMinutes = 30): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60_000).toISOString();
    const updatedAt = nowIso();
    return withDatabase(async (db) => {
      const result = await db.runAsync(
        `UPDATE sync_queue SET status = 'pending', updated_at = ?
         WHERE status = 'processing' AND updated_at < ?`,
        updatedAt,
        cutoff,
      );
      return result.changes ?? 0;
    });
  },

  async markProcessing(id: string): Promise<void> {
    const updatedAt = nowIso();
    await withDatabase(async (db) => {
      await db.runAsync(
        `UPDATE sync_queue SET status = 'processing', updated_at = ? WHERE id = ?`,
        updatedAt,
        id,
      );
    });
  },

  async markSynced(id: string): Promise<void> {
    const updatedAt = nowIso();
    await withDatabase(async (db) => {
      await db.runAsync(
        `UPDATE sync_queue SET status = 'synced', last_error = NULL, updated_at = ? WHERE id = ?`,
        updatedAt,
        id,
      );
    });
  },

  async markError(id: string, error: string): Promise<void> {
    const updatedAt = nowIso();
    await withDatabase(async (db) => {
      await db.runAsync(
        `UPDATE sync_queue
         SET status = 'error', last_error = ?, retry_count = retry_count + 1, updated_at = ?
         WHERE id = ?`,
        error.slice(0, 500),
        updatedAt,
        id,
      );
    });
  },

  async retryErrors(): Promise<number> {
    const updatedAt = nowIso();
    return withDatabase(async (db) => {
      const result = await db.runAsync(
        `UPDATE sync_queue SET status = 'pending', updated_at = ? WHERE status = 'error'`,
        updatedAt,
      );
      return result.changes ?? 0;
    });
  },

  async clearSynced(): Promise<number> {
    return withDatabase(async (db) => {
      const result = await db.runAsync(`DELETE FROM sync_queue WHERE status = 'synced'`);
      return result.changes ?? 0;
    });
  },
};
