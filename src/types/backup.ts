import Constants from 'expo-constants';

import { APP_NAME_ALT, APP_NAME_BN, APP_NAME_EN } from '@/constants/brand';
import type {
  Book,
  BookStatus,
  Bookmark,
  DailyGoal,
  GoalType,
  Mood,
  Note,
  ReadingSession,
  Reflection,
  Setting,
} from '@/types';
import { parseBookCategory, parseBookPriority } from '@/types/bookOrganization';

/** Current backup schema version — bump when top-level schema changes. */
export const BACKUP_EXPORT_VERSION = 2;

/** Backup format versions this app can import. */
export const BACKUP_SUPPORTED_VERSIONS = [1, 2] as const;

export type BackupFormatVersion = (typeof BACKUP_SUPPORTED_VERSIONS)[number];

export type ImportMode = 'merge' | 'replace';

export interface BackupBookRecord extends Omit<Book, 'localUri'> {
  /** Device-specific path; may not exist after import on another device. */
  localUri: string;
  fileName: string;
}

export interface BackupPayload {
  /** Canonical v1.4+ fields */
  appName: string;
  backupVersion: number;
  appVersion: string;
  exportedAt: string;
  platform: string;
  books: BackupBookRecord[];
  reading_sessions: ReadingSession[];
  bookmarks: Bookmark[];
  notes: Note[];
  daily_goals: DailyGoal[];
  reflections: Reflection[];
  settings: Setting[];
  /** PDF files are not included — user must copy PDFs separately. */
  pdf_files_included: false;
  /** Legacy snake_case fields (read on import; written for v1 backups). */
  app_name?: string;
  export_version?: number;
  exported_at?: string;
  app_version?: string;
}

export interface BackupValidationResult {
  valid: boolean;
  errors: BackupErrorCode[];
  warnings: BackupErrorCode[];
  payload?: BackupPayload;
}

export type BackupErrorCode =
  | 'invalid_json'
  | 'invalid_structure'
  | 'unsupported_version'
  | 'unknown_app'
  | 'pdf_included_unsupported'
  | 'import_failed'
  | 'import_partial'
  | 'import_cancelled'
  | 'legacy_backup'
  | 'newer_app_version'
  | 'older_app_version';

export class BackupError extends Error {
  readonly code: BackupErrorCode;

  constructor(code: BackupErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'BackupError';
    this.code = code;
  }
}

export interface BackupPreview {
  bookCount: number;
  sessionCount: number;
  noteCount: number;
  bookmarkCount: number;
  goalCount: number;
  reflectionCount: number;
  settingsCount: number;
  exportedAt: string;
  appVersion: string;
  backupVersion: number;
  platform: string;
  warnings: BackupErrorCode[];
}

export interface ImportResult {
  mode: ImportMode;
  booksImported: number;
  sessionsImported: number;
  notesImported: number;
  bookmarksImported: number;
  goalsImported: number;
  reflectionsImported: number;
  settingsImported: number;
  booksSkipped: number;
  sessionsSkipped: number;
  notesSkipped: number;
  bookmarksSkipped: number;
  goalsSkipped: number;
  reflectionsSkipped: number;
  settingsSkipped: number;
  missingPdfCount: number;
  warnings: BackupErrorCode[];
  hadWarnings: boolean;
}

const ACCEPTED_APP_NAMES = new Set<string>([
  APP_NAME_EN,
  APP_NAME_BN,
  `${APP_NAME_BN} (${APP_NAME_EN})`,
  `${APP_NAME_EN} (${APP_NAME_BN})`,
  ...APP_NAME_ALT,
]);

const BOOK_STATUSES: BookStatus[] = ['not_started', 'reading', 'paused', 'finished'];
const GOAL_TYPES: GoalType[] = ['pages', 'minutes', 'sessions'];
const MOODS: Mood[] = ['calm', 'tired', 'motivated', 'distracted', 'stuck'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 1 || value === '1' || value === 'true') {
    return true;
  }
  if (value === 0 || value === '0' || value === 'false') {
    return false;
  }
  return fallback;
}

function readIsoDate(value: unknown): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
}

function readBackupVersion(data: Record<string, unknown>): number | null {
  const version = data.backupVersion ?? data.export_version;
  if (typeof version === 'number' && Number.isFinite(version)) {
    return Math.floor(version);
  }
  if (typeof version === 'string' && /^\d+$/.test(version)) {
    return Number.parseInt(version, 10);
  }
  return null;
}

function readAppName(data: Record<string, unknown>): string {
  const name = data.appName ?? data.app_name;
  return typeof name === 'string' ? name.trim() : '';
}

function isAcceptedAppName(name: string): boolean {
  if (!name) {
    return true;
  }
  if (ACCEPTED_APP_NAMES.has(name)) {
    return true;
  }
  const lower = name.toLowerCase();
  return lower.includes('tin pata') || lower.includes('তিনপাতা') || lower.includes('three page');
}

function sanitizeBook(raw: unknown): BackupBookRecord | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = readString(raw.id);
  const title = readString(raw.title);
  if (!id || !title) {
    return null;
  }

  const statusRaw = readString(raw.status, 'not_started');
  const status = BOOK_STATUSES.includes(statusRaw as BookStatus)
    ? (statusRaw as BookStatus)
    : 'not_started';

  return {
    id,
    title,
    author: typeof raw.author === 'string' ? raw.author : null,
    localUri: readString(raw.localUri ?? raw.local_uri),
    fileName: readString(raw.fileName ?? raw.file_name, 'book.pdf'),
    fileSize: readNumber(raw.fileSize ?? raw.file_size),
    cloudinaryPublicId: null,
    cloudinaryAssetId: null,
    totalPages: readNumber(raw.totalPages ?? raw.total_pages),
    currentPage: Math.max(1, readNumber(raw.currentPage ?? raw.current_page, 1)),
    status,
    category: parseBookCategory(
      typeof raw.category === 'string' ? raw.category : undefined,
    ),
    priority: parseBookPriority(
      typeof raw.priority === 'string' ? raw.priority : undefined,
    ),
    isUploaded: false,
    isDownloaded: readBool(raw.isDownloaded ?? raw.is_downloaded),
    createdAt: readIsoDate(raw.createdAt ?? raw.created_at),
    updatedAt: readIsoDate(raw.updatedAt ?? raw.updated_at),
  };
}

function sanitizeSession(raw: unknown): ReadingSession | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = readString(raw.id);
  const bookId = readString(raw.bookId ?? raw.book_id);
  if (!id || !bookId) {
    return null;
  }

  const moodRaw = raw.mood;
  const mood =
    typeof moodRaw === 'string' && MOODS.includes(moodRaw as Mood)
      ? (moodRaw as Mood)
      : null;

  return {
    id,
    bookId,
    startPage: readNumber(raw.startPage ?? raw.start_page),
    endPage: readNumber(raw.endPage ?? raw.end_page),
    pagesRead: readNumber(raw.pagesRead ?? raw.pages_read),
    durationSeconds: readNumber(raw.durationSeconds ?? raw.duration_seconds),
    focusLevel:
      raw.focusLevel === null || raw.focus_level === null
        ? null
        : readNumber(raw.focusLevel ?? raw.focus_level, 0),
    mood,
    blockerReason:
      typeof (raw.blockerReason ?? raw.blocker_reason) === 'string'
        ? readString(raw.blockerReason ?? raw.blocker_reason)
        : null,
    createdAt: readIsoDate(raw.createdAt ?? raw.created_at),
  };
}

function sanitizeBookmark(raw: unknown): Bookmark | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = readString(raw.id);
  const bookId = readString(raw.bookId ?? raw.book_id);
  if (!id || !bookId) {
    return null;
  }
  return {
    id,
    bookId,
    pageNumber: Math.max(1, readNumber(raw.pageNumber ?? raw.page_number, 1)),
    title: typeof raw.title === 'string' ? raw.title : null,
    createdAt: readIsoDate(raw.createdAt ?? raw.created_at),
  };
}

function sanitizeNote(raw: unknown): Note | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = readString(raw.id);
  const bookId = readString(raw.bookId ?? raw.book_id);
  const noteText = readString(raw.noteText ?? raw.note_text);
  if (!id || !bookId || !noteText) {
    return null;
  }
  const createdAt = readIsoDate(raw.createdAt ?? raw.created_at);
  return {
    id,
    bookId,
    pageNumber: Math.max(1, readNumber(raw.pageNumber ?? raw.page_number, 1)),
    noteText,
    createdAt,
    updatedAt: readIsoDate(raw.updatedAt ?? raw.updated_at ?? createdAt),
  };
}

function sanitizeGoal(raw: unknown): DailyGoal | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = readString(raw.id);
  const goalTypeRaw = readString(raw.goalType ?? raw.goal_type, 'pages');
  if (!id || !GOAL_TYPES.includes(goalTypeRaw as GoalType)) {
    return null;
  }
  return {
    id,
    goalType: goalTypeRaw as GoalType,
    targetValue: readNumber(raw.targetValue ?? raw.target_value, 1),
    isActive: readBool(raw.isActive ?? raw.is_active),
    createdAt: readIsoDate(raw.createdAt ?? raw.created_at),
  };
}

function sanitizeReflection(raw: unknown): Reflection | null {
  if (!isRecord(raw)) {
    return null;
  }
  const id = readString(raw.id);
  const text = readString(raw.text);
  if (!id || !text) {
    return null;
  }
  const bookIdRaw = raw.bookId ?? raw.book_id;
  return {
    id,
    text,
    bookId: typeof bookIdRaw === 'string' && bookIdRaw.length > 0 ? bookIdRaw : null,
    createdAt: readIsoDate(raw.createdAt ?? raw.created_at),
  };
}

function sanitizeSetting(raw: unknown): Setting | null {
  if (!isRecord(raw)) {
    return null;
  }
  const key = readString(raw.key);
  if (!key) {
    return null;
  }
  const value = raw.value;
  return {
    key,
    value: value === null || value === undefined ? '' : String(value),
    updatedAt: readIsoDate(raw.updatedAt ?? raw.updated_at),
  };
}

function sanitizeArray<T>(
  raw: unknown,
  sanitizer: (item: unknown) => T | null,
): { items: T[]; skipped: number } {
  if (!Array.isArray(raw)) {
    return { items: [], skipped: 0 };
  }
  const items: T[] = [];
  let skipped = 0;
  for (const entry of raw) {
    const parsed = sanitizer(entry);
    if (parsed) {
      items.push(parsed);
    } else {
      skipped += 1;
    }
  }
  return { items, skipped };
}

function compareAppVersions(backupVersion: string, currentVersion: string): BackupErrorCode | null {
  const parse = (value: string) =>
    value
      .split('.')
      .map((part) => Number.parseInt(part, 10))
      .filter((part) => Number.isFinite(part));

  const backupParts = parse(backupVersion);
  const currentParts = parse(currentVersion);
  if (backupParts.length === 0 || currentParts.length === 0) {
    return null;
  }

  const length = Math.max(backupParts.length, currentParts.length);
  for (let index = 0; index < length; index += 1) {
    const backupPart = backupParts[index] ?? 0;
    const currentPart = currentParts[index] ?? 0;
    if (backupPart > currentPart) {
      return 'newer_app_version';
    }
    if (backupPart < currentPart) {
      return 'older_app_version';
    }
  }
  return null;
}

/** Ensures category/priority from older backups get safe defaults. */
export function normalizeBookFromBackup(raw: BackupBookRecord): Book {
  return {
    ...raw,
    category: parseBookCategory(raw.category),
    priority: parseBookPriority(raw.priority),
  };
}

export function createEmptyImportResult(mode: ImportMode): ImportResult {
  return {
    mode,
    booksImported: 0,
    sessionsImported: 0,
    notesImported: 0,
    bookmarksImported: 0,
    goalsImported: 0,
    reflectionsImported: 0,
    settingsImported: 0,
    booksSkipped: 0,
    sessionsSkipped: 0,
    notesSkipped: 0,
    bookmarksSkipped: 0,
    goalsSkipped: 0,
    reflectionsSkipped: 0,
    settingsSkipped: 0,
    missingPdfCount: 0,
    warnings: [],
    hadWarnings: false,
  };
}

export function buildBackupPreview(payload: BackupPayload): BackupPreview {
  const currentAppVersion = Constants.expoConfig?.version ?? '1.0.0';
  const warnings: BackupErrorCode[] = [];

  if (payload.backupVersion < BACKUP_EXPORT_VERSION) {
    warnings.push('legacy_backup');
  }

  const versionCompare = compareAppVersions(payload.appVersion, currentAppVersion);
  if (versionCompare) {
    warnings.push(versionCompare);
  }

  return {
    bookCount: payload.books.length,
    sessionCount: payload.reading_sessions.length,
    noteCount: payload.notes.length,
    bookmarkCount: payload.bookmarks.length,
    goalCount: payload.daily_goals.length,
    reflectionCount: payload.reflections.length,
    settingsCount: payload.settings.length,
    exportedAt: payload.exportedAt,
    appVersion: payload.appVersion,
    backupVersion: payload.backupVersion,
    platform: payload.platform,
    warnings,
  };
}

export function validateBackupJson(raw: unknown): BackupValidationResult {
  const errors: BackupErrorCode[] = [];
  const warnings: BackupErrorCode[] = [];

  if (!isRecord(raw)) {
    return { valid: false, errors: ['invalid_structure'], warnings: [] };
  }

  const backupVersion = readBackupVersion(raw);
  if (backupVersion === null) {
    warnings.push('legacy_backup');
  } else if (!BACKUP_SUPPORTED_VERSIONS.includes(backupVersion as BackupFormatVersion)) {
    errors.push('unsupported_version');
  }

  const appName = readAppName(raw);
  if (!isAcceptedAppName(appName)) {
    errors.push('unknown_app');
  } else if (!appName) {
    warnings.push('legacy_backup');
  }

  if (raw.pdf_files_included === true) {
    errors.push('pdf_included_unsupported');
  }

  const requiredCollections = [
    'books',
    'reading_sessions',
    'bookmarks',
    'notes',
    'daily_goals',
    'reflections',
    'settings',
  ] as const;

  for (const field of requiredCollections) {
    if (raw[field] !== undefined && !Array.isArray(raw[field])) {
      errors.push('invalid_structure');
      break;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const books = sanitizeArray(raw.books, sanitizeBook);
  const sessions = sanitizeArray(raw.reading_sessions, sanitizeSession);
  const bookmarks = sanitizeArray(raw.bookmarks, sanitizeBookmark);
  const notes = sanitizeArray(raw.notes, sanitizeNote);
  const goals = sanitizeArray(raw.daily_goals, sanitizeGoal);
  const reflections = sanitizeArray(raw.reflections, sanitizeReflection);
  const settings = sanitizeArray(raw.settings, sanitizeSetting);

  const totalSkipped =
    books.skipped +
    sessions.skipped +
    bookmarks.skipped +
    notes.skipped +
    goals.skipped +
    reflections.skipped +
    settings.skipped;

  if (totalSkipped > 0) {
    warnings.push('import_partial');
  }

  const resolvedVersion = backupVersion ?? 1;
  if (resolvedVersion < BACKUP_EXPORT_VERSION) {
    warnings.push('legacy_backup');
  }

  const payload: BackupPayload = {
    appName: appName || APP_NAME_EN,
    backupVersion: resolvedVersion,
    appVersion: readString(raw.appVersion ?? raw.app_version, 'unknown'),
    exportedAt: readIsoDate(raw.exportedAt ?? raw.exported_at),
    platform: readString(raw.platform, 'unknown'),
    books: books.items,
    reading_sessions: sessions.items,
    bookmarks: bookmarks.items,
    notes: notes.items,
    daily_goals: goals.items,
    reflections: reflections.items,
    settings: settings.items,
    pdf_files_included: false,
    app_name: appName || APP_NAME_EN,
    export_version: resolvedVersion,
    exported_at: readIsoDate(raw.exportedAt ?? raw.exported_at),
    app_version: readString(raw.appVersion ?? raw.app_version, 'unknown'),
  };

  const versionCompare = compareAppVersions(
    payload.appVersion,
    Constants.expoConfig?.version ?? '1.0.0',
  );
  if (versionCompare && !warnings.includes(versionCompare)) {
    warnings.push(versionCompare);
  }

  return { valid: true, errors: [], warnings, payload };
}
