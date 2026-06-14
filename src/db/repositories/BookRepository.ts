import { getDatabase } from '@/db/database';
import type { Book, BookStatus } from '@/types';

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
  is_uploaded: number;
  is_downloaded: number;
  created_at: string;
  updated_at: string;
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
    isUploaded: row.is_uploaded === 1,
    isDownloaded: row.is_downloaded === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const BookRepository = {
  async getAllBooks(): Promise<Book[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<BookRow>(
      'SELECT * FROM books ORDER BY updated_at DESC',
    );
    return rows.map(mapRow);
  },

  async getBookById(id: string): Promise<Book | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<BookRow>(
      'SELECT * FROM books WHERE id = ?',
      id,
    );
    return row ? mapRow(row) : null;
  },

  async createBook(book: Book): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO books (
        id, title, author, local_uri, file_name, file_size,
        cloudinary_public_id, cloudinary_asset_id, total_pages, current_page,
        status, is_uploaded, is_downloaded, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      book.isUploaded ? 1 : 0,
      book.isDownloaded ? 1 : 0,
      book.createdAt,
      book.updatedAt,
    );
  },

  async updateBook(id: string, fields: Partial<Book>): Promise<void> {
    const existing = await this.getBookById(id);
    if (!existing) {
      return;
    }

    const updated: Book = {
      ...existing,
      ...fields,
      updatedAt: new Date().toISOString(),
    };

    const db = await getDatabase();
    await db.runAsync(
      `UPDATE books SET
        title = ?, author = ?, local_uri = ?, file_name = ?, file_size = ?,
        cloudinary_public_id = ?, cloudinary_asset_id = ?, total_pages = ?,
        current_page = ?, status = ?, is_uploaded = ?, is_downloaded = ?,
        updated_at = ?
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
      updated.isUploaded ? 1 : 0,
      updated.isDownloaded ? 1 : 0,
      updated.updatedAt,
      id,
    );
  },

  async updateCurrentPage(id: string, currentPage: number): Promise<void> {
    await this.updateBook(id, { currentPage });
  },

  async updateStatus(id: string, status: BookStatus): Promise<void> {
    await this.updateBook(id, { status });
  },

  async deleteBook(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM books WHERE id = ?', id);
  },

  async count(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM books',
    );
    return row?.count ?? 0;
  },

  async getContinueReadingBook(): Promise<Book | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<BookRow>(
      `SELECT * FROM books
       WHERE status = 'reading'
       ORDER BY updated_at DESC
       LIMIT 1`,
    );
    return row ? mapRow(row) : null;
  },

  async getLastReadingBook(): Promise<Book | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<BookRow>(
      `SELECT * FROM books
       WHERE status IN ('reading', 'paused', 'not_started')
       ORDER BY updated_at DESC
       LIMIT 1`,
    );
    return row ? mapRow(row) : null;
  },
};
