import { withDatabase } from '@/db/database';
import { BookRepository } from '@/db/repositories/BookRepository';
import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import { LAST_BACKUP_AT_KEY } from '@/types/reader';

export interface BackupHealthSnapshot {
  lastBackupAt: string | null;
  bookCount: number;
  missingPdfCount: number;
  noteCount: number;
  bookmarkCount: number;
}

async function countTable(table: 'notes' | 'bookmarks'): Promise<number> {
  return withDatabase(async (db) => {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM ${table}`,
    );
    return row?.count ?? 0;
  });
}

export const BackupHealthService = {
  async getHealthSnapshot(): Promise<BackupHealthSnapshot> {
    const [books, lastBackupAt, noteCount, bookmarkCount] = await Promise.all([
      BookRepository.getAllBooks(),
      SettingsRepository.get(LAST_BACKUP_AT_KEY),
      countTable('notes'),
      countTable('bookmarks'),
    ]);

    return {
      lastBackupAt,
      bookCount: books.length,
      missingPdfCount: PdfAvailabilityService.countMissingPdfs(books),
      noteCount,
      bookmarkCount,
    };
  },
};
