import type { BookCategory, BookPriority } from '@/types/bookOrganization';
import type { SyncMetadata } from '@/types/sync';

export type BookStatus = 'not_started' | 'reading' | 'paused' | 'finished';

export type { BookCategory, BookPriority } from '@/types/bookOrganization';
export type { SyncMetadata, SyncStatus, SyncableEntity, DeviceIdentity, LocalSyncSummary, SyncQueueItem, SyncEngineStatus, SyncEngineState, SyncEntityType, LinkLocalDataResult, SyncIntegrityReport, SyncIntegrityIssue, SyncRepairResult, SyncPushResult } from '@/types/sync';

export interface Book extends SyncMetadata {
  id: string;
  title: string;
  author: string | null;
  localUri: string;
  fileName: string;
  fileSize: number;
  cloudinaryPublicId: string | null;
  cloudinaryAssetId: string | null;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  category: BookCategory;
  priority: BookPriority;
  isUploaded: boolean;
  isDownloaded: boolean;
  createdAt: string;
  updatedAt: string;
  currentPageUpdatedAt: string | null;
  /** Supabase Storage path, e.g. `{userId}/books/{bookId}/original.pdf` */
  cloudStoragePath: string | null;
  pdfFileName: string | null;
  pdfFileSize: number | null;
  pdfSha256: string | null;
  pdfUploadedAt: string | null;
  pdfCloudAvailable: boolean;
  pdfCloudDeletedAt: string | null;
}

export type Mood = 'calm' | 'tired' | 'motivated' | 'distracted' | 'stuck';

export interface ReadingSession extends SyncMetadata {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  durationSeconds: number;
  focusLevel: number | null;
  mood: Mood | null;
  blockerReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GoalType = 'pages' | 'minutes' | 'sessions';

export interface DailyGoal extends SyncMetadata {
  id: string;
  goalType: GoalType;
  targetValue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark extends SyncMetadata {
  id: string;
  bookId: string;
  pageNumber: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note extends SyncMetadata {
  id: string;
  bookId: string;
  pageNumber: number;
  noteText: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteWithBook extends Note {
  bookTitle: string;
}

export interface BookmarkWithBook extends Bookmark {
  bookTitle: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface Reflection extends SyncMetadata {
  id: string;
  text: string;
  bookId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookAnnotationCounts {
  bookmarkCount: number;
  noteCount: number;
}
