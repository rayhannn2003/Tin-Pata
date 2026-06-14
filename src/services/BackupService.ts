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
import { APP_NAME_BN } from '@/constants/brand';
import { NOTIFICATION_SETTING_KEYS } from '@/types/notification';
import { LAST_BACKUP_AT_KEY, PORTABLE_READER_SETTING_KEYS } from '@/types/reader';
import {
  BACKUP_EXPORT_VERSION,
  type BackupPayload,
  type BackupValidationResult,
} from '@/types/backup';
import type { Book, Bookmark, DailyGoal, Note, ReadingSession } from '@/types';

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

    return {
      app_version: Constants.expoConfig?.version ?? '1.1.0',
      export_version: BACKUP_EXPORT_VERSION,
      exported_at: new Date().toISOString(),
      app_name: APP_NAME_BN,
      books: books.map(stripCloudFields),
      reading_sessions: sessions,
      bookmarks,
      notes,
      daily_goals: goals,
      reflections,
      settings,
      pdf_files_included: false,
    };
  },

  validateBackupJson(raw: unknown): BackupValidationResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return { valid: false, errors: ['Invalid JSON structure.'] };
    }

    const data = raw as Record<string, unknown>;

    if (data.export_version !== BACKUP_EXPORT_VERSION) {
      errors.push(`Unsupported export version: ${String(data.export_version)}`);
    }

    for (const field of [
      'books',
      'reading_sessions',
      'bookmarks',
      'notes',
      'daily_goals',
      'reflections',
      'settings',
    ] as const) {
      if (!Array.isArray(data[field])) {
        errors.push(`Missing or invalid field: ${field}`);
      }
    }

    if (data.pdf_files_included === true) {
      errors.push('PDF-included backups are not supported.');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, errors: [], payload: data as unknown as BackupPayload };
  },

  async parseBackupFromPicker(): Promise<BackupPayload> {
    if (Platform.OS === 'web') {
      throw new Error('Import is not available on web preview.');
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      throw new Error('Import cancelled.');
    }

    const importFile = new File(result.assets[0].uri);
    const content = await importFile.text();

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      throw new Error('File is not valid JSON.');
    }

    const validation = this.validateBackupJson(parsed);
    if (!validation.valid || !validation.payload) {
      throw new Error(validation.errors.join('\n'));
    }

    return validation.payload;
  },

  async exportData(): Promise<string> {
    if (Platform.OS === 'web') {
      throw new Error('Export is not available on web preview.');
    }

    const payload = await this.createBackupPayload();
    const json = JSON.stringify(payload, null, 2);
    const fileName = formatBackupFileName();
    const file = new File(Paths.cache, fileName);
    file.write(json);

    await SettingsRepository.set(LAST_BACKUP_AT_KEY, payload.exported_at);

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

  async importDataFromFile(): Promise<BackupPayload> {
    const payload = await this.parseBackupFromPicker();
    await this.replaceDataFromBackup(payload);
    return payload;
  },

  async replaceDataFromBackup(payload: BackupPayload): Promise<void> {
    const validation = this.validateBackupJson(payload);
    if (!validation.valid) {
      throw new Error(validation.errors.join('\n'));
    }

    try {
      const { NotificationService } = await import('@/services/NotificationService');
      await NotificationService.cancelAllQuietReaderNotifications();
    } catch {
      // Native module may be unavailable.
    }

    await withDatabase(async (db) => {
      await db.withTransactionAsync(async () => {
        await clearAllDataInTransaction(db);

        for (const book of payload.books) {
          let isDownloaded = book.isDownloaded;
          if (book.localUri) {
            try {
              isDownloaded = new File(book.localUri).exists;
            } catch {
              isDownloaded = false;
            }
          }

          await BookRepository.createBook({
            ...book,
            isDownloaded,
            cloudinaryPublicId: null,
            cloudinaryAssetId: null,
            isUploaded: false,
          });
        }

        for (const session of payload.reading_sessions) {
          await SessionRepository.createSession(session as ReadingSession);
        }

        for (const bookmark of payload.bookmarks) {
          await BookmarkRepository.createBookmark(bookmark as Bookmark);
        }

        for (const note of payload.notes) {
          await NoteRepository.createNote(note as Note);
        }

        for (const goal of payload.daily_goals) {
          await GoalRepository.createGoal(goal as DailyGoal);
        }

        for (const reflection of payload.reflections) {
          await ReflectionRepository.createReflection(reflection);
        }

        for (const setting of payload.settings) {
          if (shouldIncludeSetting(setting.key)) {
            await SettingsRepository.set(setting.key, setting.value);
          }
        }
      });
    });

    try {
      const { NotificationService } = await import('@/services/NotificationService');
      await NotificationService.rescheduleAllFromSettings();
    } catch {
      // Reminders rescheduled on next save.
    }
  },
};
