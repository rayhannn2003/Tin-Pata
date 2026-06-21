import type {
  Book,
  Bookmark,
  DailyGoal,
  Note,
  ReadingSession,
  Reflection,
} from '@/types';

function toIso(value: string | null | undefined): string | null {
  return value ?? null;
}

export function bookToRemotePayload(book: Book, userId: string, deviceId: string) {
  return {
    id: book.id,
    user_id: userId,
    device_id: deviceId,
    title: book.title,
    author: book.author,
    total_pages: book.totalPages,
    current_page: book.currentPage,
    current_page_updated_at: toIso(book.currentPageUpdatedAt ?? book.updatedAt),
    status: book.status,
    category: book.category,
    priority: book.priority,
    created_at: book.createdAt,
    updated_at: book.updatedAt,
    deleted_at: toIso(book.deletedAt),
    cloud_storage_path: book.cloudStoragePath,
    pdf_file_name: book.pdfFileName,
    pdf_file_size: book.pdfFileSize,
    pdf_sha256: book.pdfSha256,
    pdf_uploaded_at: book.pdfUploadedAt,
    pdf_cloud_available: book.pdfCloudAvailable,
    pdf_cloud_deleted_at: book.pdfCloudDeletedAt,
  };
}

export function sessionToRemotePayload(session: ReadingSession, userId: string, deviceId: string) {
  return {
    id: session.id,
    user_id: userId,
    device_id: deviceId,
    book_id: session.bookId,
    start_page: session.startPage,
    end_page: session.endPage,
    pages_read: session.pagesRead,
    duration_seconds: session.durationSeconds,
    focus_level: session.focusLevel,
    mood: session.mood,
    blocker_reason: session.blockerReason,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    deleted_at: toIso(session.deletedAt),
  };
}

export function noteToRemotePayload(note: Note, userId: string, deviceId: string) {
  return {
    id: note.id,
    user_id: userId,
    device_id: deviceId,
    book_id: note.bookId,
    page_number: note.pageNumber,
    note_text: note.noteText,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    deleted_at: toIso(note.deletedAt),
  };
}

export function bookmarkToRemotePayload(bookmark: Bookmark, userId: string, deviceId: string) {
  return {
    id: bookmark.id,
    user_id: userId,
    device_id: deviceId,
    book_id: bookmark.bookId,
    page_number: bookmark.pageNumber,
    title: bookmark.title,
    created_at: bookmark.createdAt,
    updated_at: bookmark.updatedAt,
    deleted_at: toIso(bookmark.deletedAt),
  };
}

export function goalToRemotePayload(goal: DailyGoal, userId: string, deviceId: string) {
  return {
    id: goal.id,
    user_id: userId,
    device_id: deviceId,
    goal_type: goal.goalType,
    target_value: goal.targetValue,
    is_active: goal.isActive,
    created_at: goal.createdAt,
    updated_at: goal.updatedAt,
    deleted_at: toIso(goal.deletedAt),
  };
}

export function reflectionToRemotePayload(
  reflection: Reflection,
  userId: string,
  deviceId: string,
) {
  return {
    id: reflection.id,
    user_id: userId,
    device_id: deviceId,
    text: reflection.text,
    book_id: reflection.bookId,
    created_at: reflection.createdAt,
    updated_at: reflection.updatedAt,
    deleted_at: toIso(reflection.deletedAt),
  };
}

export function settingToRemotePayload(
  key: string,
  value: string,
  userId: string,
  deviceId: string,
  updatedAt: string,
) {
  return {
    id: `${userId}:${key}`,
    user_id: userId,
    device_id: deviceId,
    setting_key: key,
    setting_value: value,
    created_at: updatedAt,
    updated_at: updatedAt,
    deleted_at: null,
  };
}

export const SYNCABLE_SETTING_KEYS = new Set<string>([
  'app_language',
  'theme_preference',
  'theme',
  'reader_keep_awake',
  'reader_fit_mode',
  'reader_scroll_mode',
  'reader_show_timer',
  'reader_show_progress',
  'reader_compact_actions',
  'reader_default_focus_mode',
  'reader_stability_mode',
  'reader_brightness_enabled',
  'reader_brightness_value',
  'reading_reminder_enabled',
  'reading_reminder_time',
  'missed_goal_reminder_enabled',
  'missed_goal_reminder_time',
  'rescue_reminder_enabled',
  'rescue_reminder_time',
]);

export function entityTypeToTable(entityType: string): string {
  return entityType;
}
