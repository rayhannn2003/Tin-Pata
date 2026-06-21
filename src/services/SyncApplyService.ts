import { withDatabase } from '@/db/database';
import {
  DEFAULT_BOOK_CATEGORY,
  DEFAULT_BOOK_PRIORITY,
  parseBookCategory,
  parseBookPriority,
} from '@/types/bookOrganization';
import type { SyncEntityType } from '@/types/sync';
import { runWithRemoteSyncApply } from '@/services/SyncEnqueueService';
import { isRemoteNewer } from '@/utils/syncConflict';
import { nowIso } from '@/utils/syncMetadata';

type RemoteRow = Record<string, unknown>;

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1';
}

function readCloudBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function mapRemotePdfCloud(row: RemoteRow) {
  return {
    cloudStoragePath: readString(row.cloud_storage_path),
    pdfFileName: readString(row.pdf_file_name),
    pdfFileSize: typeof row.pdf_file_size === 'number' ? row.pdf_file_size : null,
    pdfSha256: readString(row.pdf_sha256),
    pdfUploadedAt: readString(row.pdf_uploaded_at),
    pdfCloudAvailable: readCloudBool(row.pdf_cloud_available),
    pdfCloudDeletedAt: readString(row.pdf_cloud_deleted_at),
  };
}

async function softDeleteById(
  table: string,
  id: string,
  deletedAt: string,
  remoteUpdatedAt: string | null,
): Promise<boolean> {
  return withDatabase(async (db) => {
    const existing = await db.getFirstAsync<{ updated_at: string; deleted_at: string | null }>(
      `SELECT updated_at, deleted_at FROM ${table} WHERE id = ?`,
      id,
    );
    if (!existing) {
      return false;
    }
    if (existing.deleted_at && !isRemoteNewer(existing.deleted_at, deletedAt)) {
      return false;
    }
    if (!isRemoteNewer(existing.updated_at, remoteUpdatedAt ?? deletedAt)) {
      return false;
    }
    await db.runAsync(
      `UPDATE ${table}
       SET deleted_at = ?, updated_at = ?, sync_status = 'synced', last_synced_at = ?
       WHERE id = ?`,
      deletedAt,
      remoteUpdatedAt ?? deletedAt,
      nowIso(),
      id,
    );
    return true;
  });
}

async function markEntitySynced(entityType: SyncEntityType, entityId: string): Promise<void> {
  const table = entityType === 'user_settings' ? null : entityType;
  if (!table) {
    return;
  }
  const syncedAt = nowIso();
  await withDatabase(async (db) => {
    await db.runAsync(
      `UPDATE ${table} SET sync_status = 'synced', last_synced_at = ? WHERE id = ?`,
      syncedAt,
      entityId,
    );
  });
}

async function applyRemoteBook(row: RemoteRow): Promise<boolean> {
  const id = readString(row.id);
  if (!id) {
    return false;
  }

  return withDatabase(async (db) => {
    const existing = await db.getFirstAsync<{
      title: string;
      author: string | null;
      total_pages: number;
      current_page: number;
      status: string;
      category: string;
      priority: string;
      updated_at: string;
      current_page_updated_at: string | null;
      cloud_storage_path: string | null;
      pdf_file_name: string | null;
      pdf_file_size: number | null;
      pdf_sha256: string | null;
      pdf_uploaded_at: string | null;
      pdf_cloud_available: number;
      pdf_cloud_deleted_at: string | null;
      is_uploaded: number;
    }>('SELECT * FROM books WHERE id = ?', id);

    const remoteUpdatedAt = readString(row.updated_at);
    const remotePageUpdatedAt = readString(row.current_page_updated_at);
    const pdfCloud = mapRemotePdfCloud(row);

    if (existing) {
      const metadataWins = isRemoteNewer(existing.updated_at, remoteUpdatedAt);
      const pageWins = isRemoteNewer(existing.current_page_updated_at, remotePageUpdatedAt);
      const pdfWins = isRemoteNewer(existing.pdf_uploaded_at, pdfCloud.pdfUploadedAt);
      if (!metadataWins && !pageWins && !pdfWins) {
        return false;
      }

      const nextTitle = metadataWins ? (readString(row.title) ?? existing.title) : existing.title;
      const nextAuthor = metadataWins ? readString(row.author) : existing.author;
      const nextTotalPages = metadataWins
        ? readNumber(row.total_pages, existing.total_pages)
        : existing.total_pages;
      const nextPage = pageWins ? readNumber(row.current_page, existing.current_page) : existing.current_page;
      const nextStatus = metadataWins
        ? (readString(row.status) ?? existing.status)
        : existing.status;
      const nextCategory = metadataWins
        ? parseBookCategory(readString(row.category) ?? existing.category)
        : parseBookCategory(existing.category);
      const nextPriority = metadataWins
        ? parseBookPriority(readString(row.priority) ?? existing.priority)
        : parseBookPriority(existing.priority);
      const nextUpdatedAt = metadataWins
        ? (remoteUpdatedAt ?? existing.updated_at)
        : existing.updated_at;
      const nextPageUpdatedAt = pageWins
        ? (remotePageUpdatedAt ?? remoteUpdatedAt ?? existing.current_page_updated_at)
        : existing.current_page_updated_at;

      const nextCloudPath = pdfWins ? pdfCloud.cloudStoragePath : existing.cloud_storage_path;
      const nextPdfName = pdfWins ? pdfCloud.pdfFileName : existing.pdf_file_name;
      const nextPdfSize = pdfWins ? pdfCloud.pdfFileSize : existing.pdf_file_size;
      const nextPdfSha = pdfWins ? pdfCloud.pdfSha256 : existing.pdf_sha256;
      const nextPdfUploadedAt = pdfWins ? pdfCloud.pdfUploadedAt : existing.pdf_uploaded_at;
      const nextPdfCloudAvailable = pdfWins
        ? pdfCloud.pdfCloudAvailable
        : existing.pdf_cloud_available === 1;
      const nextPdfCloudDeletedAt = pdfWins
        ? pdfCloud.pdfCloudDeletedAt
        : existing.pdf_cloud_deleted_at;
      const nextIsUploaded = pdfWins ? (pdfCloud.pdfCloudAvailable ? 1 : 0) : existing.is_uploaded;

      await db.runAsync(
        `UPDATE books SET
          title = ?, author = ?, total_pages = ?, current_page = ?, status = ?,
          category = ?, priority = ?, updated_at = ?, user_id = ?, device_id = ?,
          sync_status = 'synced', last_synced_at = ?, deleted_at = ?,
          current_page_updated_at = ?,
          cloud_storage_path = ?, pdf_file_name = ?, pdf_file_size = ?, pdf_sha256 = ?,
          pdf_uploaded_at = ?, pdf_cloud_available = ?, pdf_cloud_deleted_at = ?,
          is_uploaded = ?
         WHERE id = ?`,
        nextTitle,
        nextAuthor,
        nextTotalPages,
        nextPage,
        nextStatus,
        nextCategory,
        nextPriority,
        nextUpdatedAt,
        readString(row.user_id),
        readString(row.device_id),
        nowIso(),
        readString(row.deleted_at),
        nextPageUpdatedAt,
        nextCloudPath,
        nextPdfName,
        nextPdfSize,
        nextPdfSha,
        nextPdfUploadedAt,
        nextPdfCloudAvailable ? 1 : 0,
        nextPdfCloudDeletedAt,
        nextIsUploaded,
        id,
      );
      return true;
    }

    await db.runAsync(
      `INSERT INTO books (
        id, title, author, local_uri, file_name, file_size,
        cloudinary_public_id, cloudinary_asset_id, total_pages, current_page,
        status, category, priority, is_uploaded, is_downloaded, created_at, updated_at,
        user_id, device_id, sync_status, last_synced_at, deleted_at, current_page_updated_at,
        cloud_storage_path, pdf_file_name, pdf_file_size, pdf_sha256, pdf_uploaded_at,
        pdf_cloud_available, pdf_cloud_deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 'synced', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      readString(row.title) ?? 'Untitled',
      readString(row.author),
      '',
      pdfCloud.pdfFileName ?? `${id}.pdf`,
      pdfCloud.pdfFileSize ?? 0,
      null,
      null,
      readNumber(row.total_pages),
      readNumber(row.current_page, 1),
      readString(row.status) ?? 'not_started',
      parseBookCategory(readString(row.category) ?? DEFAULT_BOOK_CATEGORY),
      parseBookPriority(readString(row.priority) ?? DEFAULT_BOOK_PRIORITY),
      pdfCloud.pdfCloudAvailable ? 1 : 0,
      readString(row.created_at) ?? nowIso(),
      remoteUpdatedAt ?? nowIso(),
      readString(row.user_id),
      readString(row.device_id),
      nowIso(),
      readString(row.deleted_at),
      remotePageUpdatedAt ?? remoteUpdatedAt,
      pdfCloud.cloudStoragePath,
      pdfCloud.pdfFileName,
      pdfCloud.pdfFileSize,
      pdfCloud.pdfSha256,
      pdfCloud.pdfUploadedAt,
      pdfCloud.pdfCloudAvailable ? 1 : 0,
      pdfCloud.pdfCloudDeletedAt,
    );
    return true;
  });
}

async function applyRemoteSession(row: RemoteRow): Promise<boolean> {
  const id = readString(row.id);
  if (!id) {
    return false;
  }

  return withDatabase(async (db) => {
    const existing = await db.getFirstAsync<{ updated_at: string; deleted_at: string | null }>(
      'SELECT updated_at, deleted_at FROM reading_sessions WHERE id = ?',
      id,
    );
    const remoteUpdatedAt = readString(row.updated_at);
    const remoteDeletedAt = readString(row.deleted_at);

    if (existing) {
      if (remoteDeletedAt) {
        return softDeleteById('reading_sessions', id, remoteDeletedAt, remoteUpdatedAt);
      }
      return false;
    }

    if (remoteDeletedAt) {
      return false;
    }

    await db.runAsync(
      `INSERT INTO reading_sessions (
        id, book_id, start_page, end_page, pages_read, duration_seconds,
        focus_level, mood, blocker_reason, created_at, updated_at,
        user_id, device_id, sync_status, last_synced_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
      id,
      readString(row.book_id) ?? '',
      readNumber(row.start_page, 1),
      readNumber(row.end_page, 1),
      readNumber(row.pages_read),
      readNumber(row.duration_seconds),
      typeof row.focus_level === 'number' ? row.focus_level : null,
      readString(row.mood) as never,
      readString(row.blocker_reason),
      readString(row.created_at) ?? nowIso(),
      readString(row.updated_at) ?? nowIso(),
      readString(row.user_id),
      readString(row.device_id),
      nowIso(),
      readString(row.deleted_at),
    );
    return true;
  });
}

async function applyRemoteNoteOrBookmark(
  table: 'notes' | 'bookmarks',
  row: RemoteRow,
): Promise<boolean> {
  const id = readString(row.id);
  if (!id) {
    return false;
  }

  return withDatabase(async (db) => {
    const existing = await db.getFirstAsync<{ updated_at: string; deleted_at: string | null }>(
      `SELECT updated_at, deleted_at FROM ${table} WHERE id = ?`,
      id,
    );
    const remoteUpdatedAt = readString(row.updated_at);
    const remoteDeletedAt = readString(row.deleted_at);

    if (existing && remoteDeletedAt) {
      return softDeleteById(table, id, remoteDeletedAt, remoteUpdatedAt);
    }

    if (existing && !isRemoteNewer(existing.updated_at, remoteUpdatedAt)) {
      return false;
    }

    if (table === 'notes') {
      if (existing) {
        await db.runAsync(
          `UPDATE notes SET book_id = ?, page_number = ?, note_text = ?, updated_at = ?,
           user_id = ?, device_id = ?, sync_status = 'synced', last_synced_at = ?, deleted_at = ?
           WHERE id = ?`,
          readString(row.book_id) ?? '',
          readNumber(row.page_number, 1),
          readString(row.note_text) ?? '',
          remoteUpdatedAt ?? nowIso(),
          readString(row.user_id),
          readString(row.device_id),
          nowIso(),
          readString(row.deleted_at),
          id,
        );
      } else {
        await db.runAsync(
          `INSERT INTO notes (
            id, book_id, page_number, note_text, created_at, updated_at,
            user_id, device_id, sync_status, last_synced_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
          id,
          readString(row.book_id) ?? '',
          readNumber(row.page_number, 1),
          readString(row.note_text) ?? '',
          readString(row.created_at) ?? nowIso(),
          remoteUpdatedAt ?? nowIso(),
          readString(row.user_id),
          readString(row.device_id),
          nowIso(),
          readString(row.deleted_at),
        );
      }
      return true;
    }

    if (existing) {
      await db.runAsync(
        `UPDATE bookmarks SET book_id = ?, page_number = ?, title = ?, updated_at = ?,
         user_id = ?, device_id = ?, sync_status = 'synced', last_synced_at = ?, deleted_at = ?
         WHERE id = ?`,
        readString(row.book_id) ?? '',
        readNumber(row.page_number, 1),
        readString(row.title),
        remoteUpdatedAt ?? nowIso(),
        readString(row.user_id),
        readString(row.device_id),
        nowIso(),
        readString(row.deleted_at),
        id,
      );
    } else {
      await db.runAsync(
        `INSERT INTO bookmarks (
          id, book_id, page_number, title, created_at, updated_at,
          user_id, device_id, sync_status, last_synced_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        id,
        readString(row.book_id) ?? '',
        readNumber(row.page_number, 1),
        readString(row.title),
        readString(row.created_at) ?? nowIso(),
        remoteUpdatedAt ?? nowIso(),
        readString(row.user_id),
        readString(row.device_id),
        nowIso(),
        readString(row.deleted_at),
      );
    }
    return true;
  });
}

async function applyRemoteGoal(row: RemoteRow): Promise<boolean> {
  const id = readString(row.id);
  if (!id) {
    return false;
  }

  return withDatabase(async (db) => {
    const existing = await db.getFirstAsync<{ updated_at: string }>(
      'SELECT updated_at FROM daily_goals WHERE id = ?',
      id,
    );
    const remoteUpdatedAt = readString(row.updated_at);
    if (existing && !isRemoteNewer(existing.updated_at, remoteUpdatedAt)) {
      return false;
    }

    if (existing) {
      await db.runAsync(
        `UPDATE daily_goals SET goal_type = ?, target_value = ?, is_active = ?, updated_at = ?,
         user_id = ?, device_id = ?, sync_status = 'synced', last_synced_at = ?, deleted_at = ?
         WHERE id = ?`,
        readString(row.goal_type) ?? 'pages',
        readNumber(row.target_value, 1),
        readBool(row.is_active) ? 1 : 0,
        remoteUpdatedAt ?? nowIso(),
        readString(row.user_id),
        readString(row.device_id),
        nowIso(),
        readString(row.deleted_at),
        id,
      );
    } else {
      await db.runAsync(
        `INSERT INTO daily_goals (
          id, goal_type, target_value, is_active, created_at, updated_at,
          user_id, device_id, sync_status, last_synced_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        id,
        readString(row.goal_type) ?? 'pages',
        readNumber(row.target_value, 1),
        readBool(row.is_active) ? 1 : 0,
        readString(row.created_at) ?? nowIso(),
        remoteUpdatedAt ?? nowIso(),
        readString(row.user_id),
        readString(row.device_id),
        nowIso(),
        readString(row.deleted_at),
      );
    }
    return true;
  });
}

async function applyRemoteReflection(row: RemoteRow): Promise<boolean> {
  const id = readString(row.id);
  if (!id) {
    return false;
  }

  return withDatabase(async (db) => {
    const existing = await db.getFirstAsync<{ updated_at: string }>(
      'SELECT updated_at FROM reflections WHERE id = ?',
      id,
    );
    const remoteUpdatedAt = readString(row.updated_at);
    if (existing && !isRemoteNewer(existing.updated_at, remoteUpdatedAt)) {
      return false;
    }

    if (existing) {
      await db.runAsync(
        `UPDATE reflections SET text = ?, book_id = ?, updated_at = ?,
         user_id = ?, device_id = ?, sync_status = 'synced', last_synced_at = ?, deleted_at = ?
         WHERE id = ?`,
        readString(row.text) ?? '',
        readString(row.book_id),
        remoteUpdatedAt ?? nowIso(),
        readString(row.user_id),
        readString(row.device_id),
        nowIso(),
        readString(row.deleted_at),
        id,
      );
    } else {
      await db.runAsync(
        `INSERT INTO reflections (
          id, text, book_id, created_at, updated_at,
          user_id, device_id, sync_status, last_synced_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?)`,
        id,
        readString(row.text) ?? '',
        readString(row.book_id),
        readString(row.created_at) ?? nowIso(),
        remoteUpdatedAt ?? nowIso(),
        readString(row.user_id),
        readString(row.device_id),
        nowIso(),
        readString(row.deleted_at),
      );
    }
    return true;
  });
}

async function applyRemoteSetting(row: RemoteRow): Promise<boolean> {
  const key = readString(row.setting_key);
  const value = readString(row.setting_value);
  if (!key || value === null) {
    return false;
  }

  if (readString(row.deleted_at)) {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM settings WHERE key = ?', key);
    });
    return true;
  }

  const remoteUpdatedAt = readString(row.updated_at) ?? nowIso();
  const existing = await withDatabase(async (db) => {
    return db.getFirstAsync<{ updated_at: string }>('SELECT updated_at FROM settings WHERE key = ?', key);
  });
  if (existing && !isRemoteNewer(existing.updated_at, remoteUpdatedAt)) {
    return false;
  }

  await withDatabase(async (db) => {
    await db.runAsync(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      key,
      value,
      remoteUpdatedAt,
    );
  });
  return true;
}

export const SyncApplyService = {
  markEntitySynced(entityType: SyncEntityType, entityId: string): Promise<void> {
    return markEntitySynced(entityType, entityId);
  },

  async applyRemoteRow(entityType: SyncEntityType, row: RemoteRow): Promise<boolean> {
    return runWithRemoteSyncApply(async () => {
      const remoteDeletedAt = readString(row.deleted_at);
      const remoteUpdatedAt = readString(row.updated_at);

      if (remoteDeletedAt) {
        if (entityType === 'user_settings') {
          const key = readString(row.setting_key);
          if (key) {
            await withDatabase(async (db) => {
              await db.runAsync('DELETE FROM settings WHERE key = ?', key);
            });
          }
          return true;
        }

        const id = readString(row.id);
        if (!id) {
          return false;
        }

        const table =
          entityType === 'daily_goals'
            ? 'daily_goals'
            : entityType === 'reading_sessions'
              ? 'reading_sessions'
              : entityType;

        if (
          table === 'books' ||
          table === 'reading_sessions' ||
          table === 'notes' ||
          table === 'bookmarks' ||
          table === 'daily_goals' ||
          table === 'reflections'
        ) {
          return softDeleteById(table, id, remoteDeletedAt, remoteUpdatedAt);
        }
        return false;
      }

      switch (entityType) {
        case 'books':
          return applyRemoteBook(row);
        case 'reading_sessions':
          return applyRemoteSession(row);
        case 'notes':
          return applyRemoteNoteOrBookmark('notes', row);
        case 'bookmarks':
          return applyRemoteNoteOrBookmark('bookmarks', row);
        case 'daily_goals':
          return applyRemoteGoal(row);
        case 'reflections':
          return applyRemoteReflection(row);
        case 'user_settings':
          return applyRemoteSetting(row);
        default:
          return false;
      }
    });
  },
};
