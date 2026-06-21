import { withDatabase } from '@/db/database';
import { SyncEnqueueService } from '@/services/SyncEnqueueService';
import { SyncIntegrityService } from '@/services/SyncIntegrityService';
import { SyncQueueService } from '@/services/SyncQueueService';
import { SyncStateService } from '@/services/SyncStateService';
import { AuthService } from '@/services/AuthService';
import type { SyncIntegrityReport, SyncRepairResult } from '@/types/sync';
import { nowIso } from '@/utils/syncMetadata';
import { SYNC_STATUSES } from '@/types/sync';

const SYNCABLE_TABLES = [
  'books',
  'reading_sessions',
  'notes',
  'bookmarks',
  'daily_goals',
  'reflections',
] as const;

export const SyncRepairService = {
  async retryFailedQueue(): Promise<number> {
    return SyncQueueService.retryErrors();
  },

  async clearSyncedQueue(): Promise<number> {
    return SyncQueueService.clearSynced();
  },

  async resetStuckProcessing(): Promise<number> {
    return SyncQueueService.resetStuckProcessing(30);
  },

  async normalizeInvalidSyncStatus(): Promise<number> {
    const linkedUserId = await SyncStateService.getLinkedUserId();
    if (!linkedUserId) {
      return 0;
    }

    let updated = 0;
    const allowed = new Set<string>(SYNC_STATUSES);
    const targetStatus = 'pending';

    await withDatabase(async (db) => {
      for (const table of SYNCABLE_TABLES) {
        const rows = await db.getAllAsync<{ id: string; sync_status: string | null }>(
          `SELECT id, sync_status FROM ${table} WHERE deleted_at IS NULL`,
        );
        for (const row of rows) {
          if (row.sync_status && allowed.has(row.sync_status)) {
            continue;
          }
          await db.runAsync(`UPDATE ${table} SET sync_status = ? WHERE id = ?`, targetStatus, row.id);
          updated += 1;
        }
      }
    });

    return updated;
  },

  async refreshCloudPdfFlags(): Promise<number> {
    const updatedAt = nowIso();
    return withDatabase(async (db) => {
      const clear = await db.runAsync(
        `UPDATE books SET pdf_cloud_available = 0, updated_at = ?
         WHERE deleted_at IS NULL AND pdf_cloud_available = 1
           AND (cloud_storage_path IS NULL OR cloud_storage_path = '')`,
        updatedAt,
      );
      const set = await db.runAsync(
        `UPDATE books SET pdf_cloud_available = 1, updated_at = ?
         WHERE deleted_at IS NULL AND pdf_cloud_available = 0
           AND cloud_storage_path IS NOT NULL AND cloud_storage_path != ''
           AND pdf_cloud_deleted_at IS NULL`,
        updatedAt,
      );
      return (clear.changes ?? 0) + (set.changes ?? 0);
    });
  },

  async reEnqueueUnsyncedRecords(): Promise<number> {
    const user = await AuthService.getCurrentUser();
    const linked = user ? await SyncStateService.isLocalDataLinked(user.id) : false;
    if (!user || !linked) {
      return 0;
    }
    return SyncEnqueueService.enqueueAllLinkedEntities();
  },

  async runSafeRepairs(report?: SyncIntegrityReport): Promise<SyncRepairResult> {
    const check = report ?? (await SyncIntegrityService.runSyncCheck());

    const resetStuckProcessing =
      check.counts.processingQueue > 0 ? await this.resetStuckProcessing() : 0;

    const retriedFailed =
      check.counts.failedQueue > 0 ? await this.retryFailedQueue() : 0;

    const normalizedSyncStatus =
      check.counts.invalidSyncStatus > 0 ? await this.normalizeInvalidSyncStatus() : 0;

    const refreshedCloudFlags =
      check.counts.cloudFlagMismatch > 0 ? await this.refreshCloudPdfFlags() : 0;

    const reEnqueued =
      check.counts.invalidSyncStatus > 0 || check.counts.failedQueue > 0
        ? await this.reEnqueueUnsyncedRecords()
        : 0;

    const clearedSynced =
      check.counts.syncedQueue > 20 ? await this.clearSyncedQueue() : 0;

    return {
      retriedFailed,
      clearedSynced,
      normalizedSyncStatus,
      refreshedCloudFlags,
      reEnqueued,
      resetStuckProcessing,
    };
  },
};
