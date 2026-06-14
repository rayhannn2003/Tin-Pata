export type BookStatus = 'not_started' | 'reading' | 'paused' | 'finished';

export interface Book {
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
  isUploaded: boolean;
  isDownloaded: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Mood = 'calm' | 'tired' | 'motivated' | 'distracted' | 'stuck';

export interface ReadingSession {
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
}

export type GoalType = 'pages' | 'minutes' | 'sessions';

export interface DailyGoal {
  id: string;
  goalType: GoalType;
  targetValue: number;
  isActive: boolean;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  bookId: string;
  pageNumber: number;
  title: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  bookId: string;
  pageNumber: number;
  noteText: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface Reflection {
  id: string;
  text: string;
  bookId: string | null;
  createdAt: string;
}

export interface BookAnnotationCounts {
  bookmarkCount: number;
  noteCount: number;
}
