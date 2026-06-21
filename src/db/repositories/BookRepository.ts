import { withDatabase } from '@/db/database';
import { getLocalWriteSyncFields } from '@/db/syncWriteHelpers';
import type { Book, BookStatus } from '@/types';
import {
  DEFAULT_BOOK_CATEGORY,
  DEFAULT_BOOK_PRIORITY,
  parseBookCategory,
  parseBookPriority,
  type BookCategory,
  type BookPriority,
} from '@/types/bookOrganization';
import { mapSyncFromRow } from '@/utils/syncMetadata';

interface BookRow {
  id: string;
  title: string;
  author: string | null;
  local_uri: string;
  file_name: string;
  file_size: number;
  cloudinary_public_id: string | null;
  cloudinary_asset_id: string | null;
  total_pages: number;
  current_page: number;
  status: BookStatus;
  category: string;
  priority: string;
  is_uploaded: number;
  is_downloaded: number;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  device_id: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
  deleted_at: string | null;
  current_page_updated_at: string | null;
  cloud_storage_path: string | null;
  pdf_file_name: string | null;
  pdf_file_size: number | null;
  pdf_sha256: string | null;
  pdf_uploaded_at: string | null;
  pdf_cloud_available: number;
  pdf_cloud_deleted_at: string | null;
}

function mapRow(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    localUri: row.local_uri,
    fileName: row.file_name,
    fileSize: row.file_size,
    cloudinaryPublicId: row.cloudinary_public_id,
    cloudinaryAssetId: row.cloudinary_asset_id,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    status: row.status,
    category: parseBookCategory(row.category),
    priority: parseBookPriority(row.priority),
    isUploaded: row.is_uploaded === 1,
    isDownloaded: row.is_downloaded === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentPageUpdatedAt: row.current_page_updated_at,
    cloudStoragePath: row.cloud_storage_path,
    pdfFileName: row.pdf_file_name,
    pdfFileSize: row.pdf_file_size,
    pdfSha256: row.pdf_sha256,
    pdfUploadedAt: row.pdf_uploaded_at,
    pdfCloudAvailable: row.pdf_cloud_available === 1,
    pdfCloudDeletedAt: row.pdf_cloud_deleted_at,
    ...mapSyncFromRow(row),
  };
}

export const BookRepository = {
  async getAllBooks(): Promise<Book[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<BookRow>(
        'SELECT * FROM books WHERE deleted_at IS NULL ORDER BY updated_at DESC',
      );
      return rows.map(mapRow);
    });
  },

  async getBookById(id: string): Promise<Book | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<BookRow>(
        'SELECT * FROM books WHERE id = ? AND deleted_at IS NULL',
        id,
      );
      return row ? mapRow(row) : null;
    });
  },

  async createBook(book: Book): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      await db.runAsync(
        `INSERT INTO books (
          id, title, author, local_uri, file_name, file_size,
          cloudinary_public_id, cloudinary_asset_id, total_pages, current_page,
          status, category, priority, is_uploaded, is_downloaded, created_at, updated_at,
          user_id, device_id, sync_status, last_synced_at, deleted_at, current_page_updated_at,
          cloud_storage_path, pdf_file_name, pdf_file_size, pdf_sha256, pdf_uploaded_at,
          pdf_cloud_available, pdf_cloud_deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        book.id,
        book.title,
        book.author,
        book.localUri,
        book.fileName,
        book.fileSize,
        book.cloudinaryPublicId,
        book.cloudinaryAssetId,
        book.totalPages,
        book.currentPage,
        book.status,
        book.category ?? DEFAULT_BOOK_CATEGORY,
        book.priority ?? DEFAULT_BOOK_PRIORITY,
        book.isUploaded ? 1 : 0,
        book.isDownloaded ? 1 : 0,
        book.createdAt,
        sync.updatedAt,
        book.userId ?? sync.userId,
        sync.deviceId,
        sync.syncStatus,
        book.lastSyncedAt,
        null,
        book.currentPageUpdatedAt ?? sync.updatedAt,
        book.cloudStoragePath,
        book.pdfFileName,
        book.pdfFileSize,
        book.pdfSha256,
        book.pdfUploadedAt,
        book.pdfCloudAvailable ? 1 : 0,
        book.pdfCloudDeletedAt,
      );
    });
  },

  async updateBook(id: string, fields: Partial<Book>): Promise<void> {
    const existing = await this.getBookById(id);
    if (!existing) {
      return;
    }

    const sync = await getLocalWriteSyncFields();
    const pageChanged =
      fields.currentPage !== undefined && fields.currentPage !== existing.currentPage;

    const updated: Book = {
      ...existing,
      ...fields,
      updatedAt: sync.updatedAt,
      deviceId: sync.deviceId,
      syncStatus: sync.syncStatus,
      currentPageUpdatedAt: pageChanged
        ? sync.updatedAt
        : (fields.currentPageUpdatedAt ?? existing.currentPageUpdatedAt),
    };

    await withDatabase(async (db) => {
      await db.runAsync(
        `UPDATE books SET
          title = ?, author = ?, local_uri = ?, file_name = ?, file_size = ?,
          cloudinary_public_id = ?, cloudinary_asset_id = ?, total_pages = ?,
          current_page = ?, status = ?, category = ?, priority = ?,
          is_uploaded = ?, is_downloaded = ?, updated_at = ?,
          device_id = ?, sync_status = ?, current_page_updated_at = ?,
          cloud_storage_path = ?, pdf_file_name = ?, pdf_file_size = ?, pdf_sha256 = ?,
          pdf_uploaded_at = ?, pdf_cloud_available = ?, pdf_cloud_deleted_at = ?
        WHERE id = ?`,
        updated.title,
        updated.author,
        updated.localUri,
        updated.fileName,
        updated.fileSize,
        updated.cloudinaryPublicId,
        updated.cloudinaryAssetId,
        updated.totalPages,
        updated.currentPage,
        updated.status,
        updated.category,
        updated.priority,
        updated.isUploaded ? 1 : 0,
        updated.isDownloaded ? 1 : 0,
        updated.updatedAt,
        updated.deviceId,
        updated.syncStatus,
        updated.currentPageUpdatedAt,
        updated.cloudStoragePath,
        updated.pdfFileName,
        updated.pdfFileSize,
        updated.pdfSha256,
        updated.pdfUploadedAt,
        updated.pdfCloudAvailable ? 1 : 0,
        updated.pdfCloudDeletedAt,
        id,
      );
    });
  },

  async updateCurrentPage(id: string, currentPage: number): Promise<void> {
    await this.updateBook(id, { currentPage });
  },

  async updateStatus(id: string, status: BookStatus): Promise<void> {
    await this.updateBook(id, { status });
  },

  async updateCategory(id: string, category: BookCategory): Promise<void> {
    await this.updateBook(id, { category });
  },

  async updatePriority(id: string, priority: BookPriority): Promise<void> {
    await this.updateBook(id, { priority });
  },

  /** Hard delete — soft delete planned for a later phase. */
  async deleteBook(id: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM books WHERE id = ?', id);
    });
  },

  async count(): Promise<number> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM books WHERE deleted_at IS NULL',
      );
      return row?.count ?? 0;
    });
  },

  async getContinueReadingBook(): Promise<Book | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<BookRow>(
        `SELECT * FROM books
         WHERE status = 'reading' AND deleted_at IS NULL
         ORDER BY updated_at DESC
         LIMIT 1`,
      );
      return row ? mapRow(row) : null;
    });
  },

  async getLastReadingBook(): Promise<Book | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<BookRow>(
        `SELECT * FROM books
         WHERE status IN ('reading', 'paused', 'not_started') AND deleted_at IS NULL
         ORDER BY updated_at DESC
         LIMIT 1`,
      );
      return row ? mapRow(row) : null;
    });
  },
};
