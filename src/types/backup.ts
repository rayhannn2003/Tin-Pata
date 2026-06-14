import type {
  Book,
  Bookmark,
  DailyGoal,
  Note,
  ReadingSession,
  Reflection,
  Setting,
} from '@/types';

/** Backup file format version — bump when schema changes. */
export const BACKUP_EXPORT_VERSION = 1;

export interface BackupBookRecord extends Omit<Book, 'localUri'> {
  /** Device-specific path; may not exist after import on another device. */
  localUri: string;
  fileName: string;
}

export interface BackupPayload {
  app_version: string;
  export_version: number;
  exported_at: string;
  app_name: string;
  books: BackupBookRecord[];
  reading_sessions: ReadingSession[];
  bookmarks: Bookmark[];
  notes: Note[];
  daily_goals: DailyGoal[];
  reflections: Reflection[];
  settings: Setting[];
  /** PDF files are not included — user must copy PDFs separately. */
  pdf_files_included: false;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: string[];
  payload?: BackupPayload;
}

export interface BackupPreview {
  bookCount: number;
  sessionCount: number;
  noteCount: number;
  bookmarkCount: number;
  reflectionCount: number;
  exportedAt: string;
  appVersion: string;
  exportVersion: number;
}

export function buildBackupPreview(payload: BackupPayload): BackupPreview {
  return {
    bookCount: payload.books.length,
    sessionCount: payload.reading_sessions.length,
    noteCount: payload.notes.length,
    bookmarkCount: payload.bookmarks.length,
    reflectionCount: payload.reflections.length,
    exportedAt: payload.exported_at,
    appVersion: payload.app_version,
    exportVersion: payload.export_version,
  };
}
