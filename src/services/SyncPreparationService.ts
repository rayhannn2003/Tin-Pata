import { withDatabase } from '@/db/database';
import { DeviceIdentityService } from '@/services/DeviceIdentityService';
import { SyncEngineService } from '@/services/SyncEngineService';
import { SyncEnqueueService } from '@/services/SyncEnqueueService';
import { SyncStateService } from '@/services/SyncStateService';
import type { LinkLocalDataResult, LocalSyncSummary } from '@/types/sync';
import { shortenDeviceId } from '@/utils/syncMetadata';

const SYNCABLE_TABLES = [
  'books',
  'reading_sessions',
  'bookmarks',
  'notes',
  'daily_goals',
  'reflections',
] as const;

async function countRows(table: string, where = 'deleted_at IS NULL'): Promise<number> {
  return withDatabase(async (db) => {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`,
    );
    return row?.count ?? 0;
  });
}

async function countLocalOnlyRows(): Promise<number> {
  return withDatabase(async (db) => {
    let total = 0;
    for (const table of SYNCABLE_TABLES) {
      const row = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table} WHERE user_id IS NULL AND deleted_at IS NULL`,
      );
      total += row?.count ?? 0;
    }
    return total;
  });
}

async function countSyncReadyRows(): Promise<number> {
  let total = 0;
  for (const table of SYNCABLE_TABLES) {
    total += await countRows(table);
  }
  return total;
}

export const SyncPreparationService = {
  async getCurrentLocalSyncSummary(): Promise<LocalSyncSummary> {
    const deviceId = await DeviceIdentityService.getOrCreateDeviceId();
    const linkedUserId = await SyncStateService.getLinkedUserId();
    const [syncReadyRecordCount, localOnlyRowCount] = await Promise.all([
      countSyncReadyRows(),
      countLocalOnlyRows(),
    ]);

    return {
      deviceId,
      deviceIdShort: shortenDeviceId(deviceId),
      syncReadyRecordCount,
      localOnlyRowCount,
      cloudSyncEnabled: Boolean(linkedUserId),
      isLinked: Boolean(linkedUserId),
    };
  },

  async countLocalOnlyRows(): Promise<number> {
    return countLocalOnlyRows();
  },

  async isLocalDataLinked(expectedUserId?: string | null): Promise<boolean> {
    return SyncStateService.isLocalDataLinked(expectedUserId);
  },

  /**
   * Assign user_id to local rows that have no owner yet.
   */
  async markLocalRowsForFutureUser(userId: string): Promise<number> {
    let updated = 0;
    const updatedAt = new Date().toISOString();
    const deviceId = await DeviceIdentityService.getOrCreateDeviceId();

    await withDatabase(async (db) => {
      for (const table of SYNCABLE_TABLES) {
        const result = await db.runAsync(
          `UPDATE ${table}
           SET user_id = ?, device_id = COALESCE(device_id, ?), sync_status = 'pending', updated_at = ?
           WHERE user_id IS NULL AND deleted_at IS NULL`,
          userId,
          deviceId,
          updatedAt,
        );
        updated += result.changes ?? 0;
      }
    });

    return updated;
  },

  /**
   * Manual user action — links local SQLite data to signed-in account and enqueues initial upserts.
   */
  async linkLocalDataToAccount(userId: string): Promise<LinkLocalDataResult> {
    const rowsLinked = await this.markLocalRowsForFutureUser(userId);
    await SyncStateService.setLinkedUserId(userId);
    await SyncEngineService.registerDevice(userId);
    const enqueued = await SyncEnqueueService.enqueueAllLinkedEntities();
    return { rowsLinked, enqueued };
  },
};
