import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { SQLiteDatabase } from 'expo-sqlite';
import { withDatabase } from '@/db/database';
import { BookmarkRepository } from '@/db/repositories/BookmarkRepository';
import { BookRepository } from '@/db/repositories/BookRepository';
import { GoalRepository } from '@/db/repositories/GoalRepository';
import { NoteRepository } from '@/db/repositories/NoteRepository';
import { ReflectionRepository } from '@/db/repositories/ReflectionRepository';
import { SessionRepository } from '@/db/repositories/SessionRepository';
import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { APP_NAME_EN } from '@/constants/brand';
import { NOTIFICATION_SETTING_KEYS } from '@/types/notification';
import { LAST_BACKUP_AT_KEY, PORTABLE_READER_SETTING_KEYS } from '@/types/reader';
import {
  BACKUP_EXPORT_VERSION,
  BackupError,
  createEmptyImportResult,
  normalizeBookFromBackup,
  validateBackupJson,
  type BackupBookRecord,
  type BackupPayload,
  type ImportMode,
  type ImportResult,
} from '@/types/backup';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import type { Book, Bookmark, DailyGoal, Note, ReadingSession, Reflection } from '@/types';

const PORTABLE_SETTING_KEYS = new Set<string>([
  'app_language',
  'theme_preference',
  'theme',
  'has_seen_onboarding',
  LAST_BACKUP_AT_KEY,
  ...PORTABLE_READER_SETTING_KEYS,
  NOTIFICATION_SETTING_KEYS.readingReminderEnabled,
  NOTIFICATION_SETTING_KEYS.readingReminderTime,
  NOTIFICATION_SETTING_KEYS.missedGoalReminderEnabled,
  NOTIFICATION_SETTING_KEYS.missedGoalReminderTime,
  NOTIFICATION_SETTING_KEYS.rescueReminderEnabled,
  NOTIFICATION_SETTING_KEYS.rescueReminderTime,
]);

function shouldIncludeSetting(key: string): boolean {
  return PORTABLE_SETTING_KEYS.has(key);
}

function formatBackupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `tin-pata-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}.json`;
}

async function getAllBookmarks(): Promise<Bookmark[]> {
  return withDatabase(async (db) => {
    const rows = await db.getAllAsync<{
      id: string;
      book_id: string;
      page_number: number;
      title: string | null;
      created_at: string;
    }>('SELECT * FROM bookmarks ORDER BY created_at ASC');
    return rows.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      pageNumber: row.page_number,
      title: row.title,
      createdAt: row.created_at,
    }));
  });
}

async function getAllNotes(): Promise<Note[]> {
  return withDatabase(async (db) => {
    const rows = await db.getAllAsync<{
      id: string;
      book_id: string;
      page_number: number;
      note_text: string;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM notes ORDER BY created_at ASC');
    return rows.map((row) => ({
      id: row.id,
      bookId: row.book_id,
      pageNumber: row.page_number,
      noteText: row.note_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  });
}

async function getAllGoals(): Promise<DailyGoal[]> {
  return withDatabase(async (db) => {
    const rows = await db.getAllAsync<{
      id: string;
      goal_type: DailyGoal['goalType'];
      target_value: number;
      is_active: number;
      created_at: string;
    }>('SELECT * FROM daily_goals ORDER BY created_at ASC');
    return rows.map((row) => ({
      id: row.id,
      goalType: row.goal_type,
      targetValue: row.target_value,
      isActive: row.is_active === 1,
      createdAt: row.created_at,
    }));
  });
}

function stripCloudFields(book: Book): BackupPayload['books'][number] {
  return {
    ...book,
    cloudinaryPublicId: null,
    cloudinaryAssetId: null,
    isUploaded: false,
  };
}

async function clearAllDataInTransaction(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM reflections;
    DELETE FROM notes;
    DELETE FROM bookmarks;
    DELETE FROM reading_sessions;
    DELETE FROM books;
    DELETE FROM daily_goals;
    DELETE FROM settings;
  `);
}

async function loadExistingIds(table: string): Promise<Set<string>> {
  return withDatabase(async (db) => {
    const rows = await db.getAllAsync<{ id: string }>(`SELECT id FROM ${table}`);
    return new Set(rows.map((row) => row.id));
  });
}

function resolveBookDownloadState(book: BackupBookRecord): {
  book: Book;
  missingPdf: boolean;
} {
  const prepared = normalizeBookFromBackup({
    ...book,
    cloudinaryPublicId: null,
    cloudinaryAssetId: null,
    isUploaded: false,
    isDownloaded: PdfAvailabilityService.isPdfAvailable(book),
  });

  return {
    book: prepared,
    missingPdf: !PdfAvailabilityService.isPdfAvailable(prepared),
  };
}

async function cancelReaderNotificationsQuietly(): Promise<void> {
  try {
    const { NotificationService } = await import('@/services/NotificationService');
    await NotificationService.cancelAllQuietReaderNotifications();
  } catch {
    // Native module may be unavailable.
  }
}

async function rescheduleNotificationsFromSettings(): Promise<void> {
  try {
    const { NotificationService } = await import('@/services/NotificationService');
    await NotificationService.rescheduleAllFromSettings();
  } catch {
    // Reminders rescheduled on next save.
  }
}

export const BackupService = {
  async createBackupPayload(): Promise<BackupPayload> {
    const [books, sessions, bookmarks, notes, goals, reflections, allSettings] =
      await Promise.all([
        BookRepository.getAllBooks(),
        SessionRepository.getAllSessions(),
        getAllBookmarks(),
        getAllNotes(),
        getAllGoals(),
        ReflectionRepository.getAll(),
        SettingsRepository.getAll(),
      ]);

    const settings = allSettings.filter((s) => shouldIncludeSetting(s.key));
    const exportedAt = new Date().toISOString();
    const appVersion = Constants.expoConfig?.version ?? '1.3.0';

    return {
      appName: APP_NAME_EN,
      backupVersion: BACKUP_EXPORT_VERSION,
      appVersion,
      exportedAt,
      platform: Platform.OS,
      books: books.map(stripCloudFields),
      reading_sessions: sessions,
      bookmarks,
      notes,
      daily_goals: goals,
      reflections,
      settings,
      pdf_files_included: false,
      app_name: APP_NAME_EN,
      export_version: BACKUP_EXPORT_VERSION,
      exported_at: exportedAt,
      app_version: appVersion,
    };
  },

  validateBackupJson,

  async pickAndValidateBackup(): Promise<{
    payload: BackupPayload;
    warnings: ImportResult['warnings'];
  }> {
    if (Platform.OS === 'web') {
      throw new BackupError('import_failed', 'Import is not available on web preview.');
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      throw new BackupError('import_cancelled');
    }

    const importFile = new File(result.assets[0].uri);
    const content = await importFile.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      throw new BackupError('invalid_json');
    }

    const validation = validateBackupJson(parsed);
    if (!validation.valid || !validation.payload) {
      throw new BackupError(validation.errors[0] ?? 'invalid_structure');
    }

    return {
      payload: validation.payload,
      warnings: validation.warnings,
    };
  },

  /** @deprecated Use pickAndValidateBackup */
  async parseBackupFromPicker(): Promise<BackupPayload> {
    const { payload } = await this.pickAndValidateBackup();
    return payload;
  },

  async exportData(): Promise<string> {
    if (Platform.OS === 'web') {
      throw new BackupError('import_failed', 'Export is not available on web preview.');
    }

    const payload = await this.createBackupPayload();
    const json = JSON.stringify(payload, null, 2);
    const fileName = formatBackupFileName();
    const file = new File(Paths.cache, fileName);
    file.write(json);

    await SettingsRepository.set(LAST_BACKUP_AT_KEY, payload.exportedAt);

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Tin Pata backup',
        UTI: 'public.json',
      });
    }

    return file.uri;
  },

  async getLastBackupAt(): Promise<string | null> {
    return SettingsRepository.get(LAST_BACKUP_AT_KEY);
  },

  async importBackup(payload: BackupPayload, mode: ImportMode): Promise<ImportResult> {
    if (mode === 'replace') {
      return this.replaceDataFromBackup(payload);
    }
    return this.mergeDataFromBackup(payload);
  },

  /** @deprecated Use importBackup(payload, 'replace') */
  async importDataFromFile(): Promise<BackupPayload> {
    const { payload } = await this.pickAndValidateBackup();
    await this.replaceDataFromBackup(payload);
    return payload;
  },

  async replaceDataFromBackup(payload: BackupPayload): Promise<ImportResult> {
    const validation = validateBackupJson(payload);
    if (!validation.valid || !validation.payload) {
      throw new BackupError(validation.errors[0] ?? 'invalid_structure');
    }

    const normalized = validation.payload;
    const result = createEmptyImportResult('replace');
    result.warnings = [...validation.warnings];

    await cancelReaderNotificationsQuietly();

    await withDatabase(async (db) => {
      await db.withTransactionAsync(async () => {
        await clearAllDataInTransaction(db);

        for (const book of normalized.books) {
          const { book: prepared, missingPdf } = resolveBookDownloadState(book);
          if (missingPdf) {
            result.missingPdfCount += 1;
          }
          await BookRepository.createBook(prepared);
          result.booksImported += 1;
        }

        const bookIds = new Set(normalized.books.map((book) => book.id));

        for (const session of normalized.reading_sessions) {
          if (!bookIds.has(session.bookId)) {
            result.sessionsSkipped += 1;
            continue;
          }
          await SessionRepository.createSession(session as ReadingSession);
          result.sessionsImported += 1;
        }

        for (const bookmark of normalized.bookmarks) {
          if (!bookIds.has(bookmark.bookId)) {
            result.bookmarksSkipped += 1;
            continue;
          }
          await BookmarkRepository.createBookmark(bookmark as Bookmark);
          result.bookmarksImported += 1;
        }

        for (const note of normalized.notes) {
          if (!bookIds.has(note.bookId)) {
            result.notesSkipped += 1;
            continue;
          }
          await NoteRepository.createNote(note as Note);
          result.notesImported += 1;
        }

        for (const goal of normalized.daily_goals) {
          await GoalRepository.createGoal(goal as DailyGoal);
          result.goalsImported += 1;
        }

        for (const reflection of normalized.reflections) {
          await ReflectionRepository.createReflection(reflection);
          result.reflectionsImported += 1;
        }

        for (const setting of normalized.settings) {
          if (shouldIncludeSetting(setting.key)) {
            await SettingsRepository.set(setting.key, setting.value);
            result.settingsImported += 1;
          } else {
            result.settingsSkipped += 1;
          }
        }
      });
    });

    await rescheduleNotificationsFromSettings();
    result.hadWarnings =
      result.warnings.length > 0 ||
      result.missingPdfCount > 0 ||
      result.sessionsSkipped > 0 ||
      result.notesSkipped > 0 ||
      result.bookmarksSkipped > 0;

    if (result.hadWarnings && !result.warnings.includes('import_partial')) {
      result.warnings.push('import_partial');
    }

    return result;
  },

  async mergeDataFromBackup(payload: BackupPayload): Promise<ImportResult> {
    const validation = validateBackupJson(payload);
    if (!validation.valid || !validation.payload) {
      throw new BackupError(validation.errors[0] ?? 'invalid_structure');
    }

    const normalized = validation.payload;
    const result = createEmptyImportResult('merge');
    result.warnings = [...validation.warnings];

    const [
      existingBookIds,
      existingSessionIds,
      existingBookmarkIds,
      existingNoteIds,
      existingGoalIds,
      existingReflectionIds,
      allSettings,
    ] = await Promise.all([
      loadExistingIds('books'),
      loadExistingIds('reading_sessions'),
      loadExistingIds('bookmarks'),
      loadExistingIds('notes'),
      loadExistingIds('daily_goals'),
      loadExistingIds('reflections'),
      SettingsRepository.getAll(),
    ]);

    const existingSettingKeys = new Set(allSettings.map((setting) => setting.key));

    const bookIds = new Set(existingBookIds);

    await withDatabase(async (db) => {
      await db.withTransactionAsync(async () => {
        for (const book of normalized.books) {
          if (existingBookIds.has(book.id)) {
            result.booksSkipped += 1;
            continue;
          }
          const { book: prepared, missingPdf } = resolveBookDownloadState(book);
          if (missingPdf) {
            result.missingPdfCount += 1;
          }
          await BookRepository.createBook(prepared);
          bookIds.add(book.id);
          result.booksImported += 1;
        }

        for (const session of normalized.reading_sessions) {
          if (existingSessionIds.has(session.id)) {
            result.sessionsSkipped += 1;
            continue;
          }
          if (!bookIds.has(session.bookId)) {
            result.sessionsSkipped += 1;
            continue;
          }
          await SessionRepository.createSession(session as ReadingSession);
          result.sessionsImported += 1;
        }

        for (const bookmark of normalized.bookmarks) {
          if (existingBookmarkIds.has(bookmark.id)) {
            result.bookmarksSkipped += 1;
            continue;
          }
          if (!bookIds.has(bookmark.bookId)) {
            result.bookmarksSkipped += 1;
            continue;
          }
          await BookmarkRepository.createBookmark(bookmark as Bookmark);
          result.bookmarksImported += 1;
        }

        for (const note of normalized.notes) {
          if (existingNoteIds.has(note.id)) {
            result.notesSkipped += 1;
            continue;
          }
          if (!bookIds.has(note.bookId)) {
            result.notesSkipped += 1;
            continue;
          }
          await NoteRepository.createNote(note as Note);
          result.notesImported += 1;
        }

        for (const goal of normalized.daily_goals) {
          if (existingGoalIds.has(goal.id)) {
            result.goalsSkipped += 1;
            continue;
          }
          await GoalRepository.createGoal(goal as DailyGoal);
          result.goalsImported += 1;
        }

        for (const reflection of normalized.reflections) {
          if (existingReflectionIds.has(reflection.id)) {
            result.reflectionsSkipped += 1;
            continue;
          }
          await ReflectionRepository.createReflection(reflection);
          result.reflectionsImported += 1;
        }

        for (const setting of normalized.settings) {
          if (!shouldIncludeSetting(setting.key)) {
            result.settingsSkipped += 1;
            continue;
          }
          if (existingSettingKeys.has(setting.key)) {
            result.settingsSkipped += 1;
            continue;
          }
          await SettingsRepository.set(setting.key, setting.value);
          result.settingsImported += 1;
        }
      });
    });

    await rescheduleNotificationsFromSettings();

    result.hadWarnings =
      result.warnings.length > 0 ||
      result.missingPdfCount > 0 ||
      result.booksSkipped > 0 ||
      result.sessionsSkipped > 0 ||
      result.notesSkipped > 0 ||
      result.bookmarksSkipped > 0 ||
      result.goalsSkipped > 0 ||
      result.reflectionsSkipped > 0;

    if (result.hadWarnings && !result.warnings.includes('import_partial')) {
      result.warnings.push('import_partial');
    }

    return result;
  },
};
