import { withDatabase } from '@/db/database';
import { SyncQueueService } from '@/services/SyncQueueService';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import { BookRepository } from '@/db/repositories/BookRepository';
import type { SyncIntegrityIssue, SyncIntegrityReport } from '@/types/sync';
import { SYNC_STATUSES } from '@/types/sync';

const SYNCABLE_TABLES = [
  'books',
  'reading_sessions',
  'notes',
  'bookmarks',
  'daily_goals',
  'reflections',
] as const;

async function countDuplicateIds(): Promise<number> {
  let total = 0;
  for (const table of SYNCABLE_TABLES) {
    const rows = await withDatabase(async (db) => {
      return db.getAllAsync<{ id: string; c: number }>(
        `SELECT id, COUNT(*) as c FROM ${table} GROUP BY id HAVING c > 1`,
      );
    });
    total += rows.length;
  }
  return total;
}

async function countInvalidSyncStatus(): Promise<number> {
  let total = 0;
  const allowed = new Set<string>(SYNC_STATUSES);
  for (const table of SYNCABLE_TABLES) {
    const rows = await withDatabase(async (db) => {
      return db.getAllAsync<{ sync_status: string | null }>(
        `SELECT sync_status FROM ${table} WHERE sync_status IS NOT NULL`,
      );
    });
    total += rows.filter((row) => !allowed.has(row.sync_status ?? '')).length;
  }
  return total;
}

async function countMissingUpdatedAt(): Promise<number> {
  let total = 0;
  for (const table of SYNCABLE_TABLES) {
    const row = await withDatabase(async (db) => {
      return db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM ${table} WHERE updated_at IS NULL OR updated_at = ''`,
      );
    });
    total += row?.count ?? 0;
  }
  return total;
}

export const SyncIntegrityService = {
  async runSyncCheck(): Promise<SyncIntegrityReport> {
    const [
      pendingQueue,
      failedQueue,
      processingQueue,
      syncedQueue,
      orphanedNotes,
      orphanedBookmarks,
      duplicateIds,
      invalidSyncStatus,
      cloudFlagMismatch,
      localPdfMissingCloudAvailable,
      localPdfMissingNoCloud,
      missingUpdatedAt,
    ] = await Promise.all([
      SyncQueueService.countPending(),
      SyncQueueService.countFailed(),
      SyncQueueService.countProcessing(),
      SyncQueueService.countSynced(),
      withDatabase(async (db) => {
        const row = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM notes n
           LEFT JOIN books b ON b.id = n.book_id AND b.deleted_at IS NULL
           WHERE n.deleted_at IS NULL AND b.id IS NULL`,
        );
        return row?.count ?? 0;
      }),
      withDatabase(async (db) => {
        const row = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM bookmarks bm
           LEFT JOIN books b ON b.id = bm.book_id AND b.deleted_at IS NULL
           WHERE bm.deleted_at IS NULL AND b.id IS NULL`,
        );
        return row?.count ?? 0;
      }),
      countDuplicateIds(),
      countInvalidSyncStatus(),
      withDatabase(async (db) => {
        const row = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM books
           WHERE deleted_at IS NULL AND (
             (pdf_cloud_available = 1 AND (cloud_storage_path IS NULL OR cloud_storage_path = ''))
             OR (pdf_cloud_available = 0 AND cloud_storage_path IS NOT NULL AND cloud_storage_path != '')
           )`,
        );
        return row?.count ?? 0;
      }),
      (async () => {
        const books = await BookRepository.getAllBooks();
        return books.filter(
          (book) =>
            !PdfAvailabilityService.isPdfAvailable(book) &&
            book.pdfCloudAvailable &&
            Boolean(book.cloudStoragePath),
        ).length;
      })(),
      (async () => {
        const books = await BookRepository.getAllBooks();
        return books.filter(
          (book) =>
            !PdfAvailabilityService.isPdfAvailable(book) &&
            !book.pdfCloudAvailable,
        ).length;
      })(),
      countMissingUpdatedAt(),
    ]);

    const warnings: SyncIntegrityIssue[] = [];
    const errors: SyncIntegrityIssue[] = [];

    if (failedQueue > 0) {
      warnings.push({
        code: 'failed_queue',
        message: 'Some changes failed to sync and are waiting to retry.',
        count: failedQueue,
      });
    }

    if (processingQueue > 0) {
      warnings.push({
        code: 'processing_queue',
        message: 'Some sync items were interrupted. Run sync check repair if needed.',
        count: processingQueue,
      });
    }

    if (orphanedNotes > 0) {
      warnings.push({
        code: 'orphaned_notes',
        message: 'Notes reference a missing book. They are kept locally.',
        count: orphanedNotes,
      });
    }

    if (orphanedBookmarks > 0) {
      warnings.push({
        code: 'orphaned_bookmarks',
        message: 'Bookmarks reference a missing book. They are kept locally.',
        count: orphanedBookmarks,
      });
    }

    if (localPdfMissingCloudAvailable > 0) {
      warnings.push({
        code: 'local_pdf_missing_cloud',
        message: 'Some books have a cloud PDF but no local file. Download from book detail.',
        count: localPdfMissingCloudAvailable,
      });
    }

    if (localPdfMissingNoCloud > 0) {
      warnings.push({
        code: 'local_pdf_missing',
        message: 'Some books have no local or cloud PDF. Relink or back up when ready.',
        count: localPdfMissingNoCloud,
      });
    }

    if (cloudFlagMismatch > 0) {
      warnings.push({
        code: 'cloud_flag_mismatch',
        message: 'Some books have inconsistent cloud PDF metadata.',
        count: cloudFlagMismatch,
      });
    }

    if (duplicateIds > 0) {
      errors.push({
        code: 'duplicate_ids',
        message: 'Duplicate record IDs found in the local database.',
        count: duplicateIds,
      });
    }

    if (invalidSyncStatus > 0) {
      warnings.push({
        code: 'invalid_sync_status',
        message: 'Some records have an unexpected sync status.',
        count: invalidSyncStatus,
      });
    }

    if (missingUpdatedAt > 0) {
      warnings.push({
        code: 'missing_updated_at',
        message: 'Some records are missing updated_at timestamps.',
        count: missingUpdatedAt,
      });
    }

    const counts = {
      pendingQueue,
      failedQueue,
      processingQueue,
      syncedQueue,
      orphanedNotes,
      orphanedBookmarks,
      duplicateIds,
      invalidSyncStatus,
      cloudFlagMismatch,
      localPdfMissingCloudAvailable,
      localPdfMissingNoCloud,
    };

    return {
      ok: errors.length === 0 && warnings.length === 0,
      warnings,
      errors,
      counts,
    };
  },
};
