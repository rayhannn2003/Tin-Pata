import { BookRepository } from '@/db/repositories/BookRepository';
import { SessionRepository } from '@/db/repositories/SessionRepository';
import { SyncEnqueueService } from '@/services/SyncEnqueueService';
import type { Mood, ReadingSession } from '@/types';
import type {
  FinishSessionInput,
  ReadingStatsSummary,
  SessionBlockerOption,
  SessionFocusOption,
  SessionMoodOption,
  SessionSaveResult,
  TodayReadingSummary,
} from '@/types/session';
import { getTodayBounds, nowIso } from '@/utils/date';
import { generateId } from '@/utils/ids';
import { emptySyncMetadata } from '@/utils/syncMetadata';

export class ReadingSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReadingSessionError';
  }
}

const FOCUS_TO_LEVEL: Record<SessionFocusOption, number> = {
  good: 5,
  medium: 3,
  bad: 1,
};

const MOOD_TO_DB: Record<SessionMoodOption, Mood> = {
  motivated: 'motivated',
  neutral: 'calm',
  bored: 'stuck',
  sleepy: 'tired',
  distracted: 'distracted',
};

const BLOCKER_LABELS: Record<SessionBlockerOption, string> = {
  phone: 'Phone',
  sleepy: 'Sleepy',
  hard_language: 'Hard language',
  boring: 'Boring',
  busy: 'Busy',
  stress: 'Stress',
  other: 'Other',
};

export const ReadingSessionService = {
  startSession(bookId: string, startPage: number) {
    return {
      bookId,
      startPage: Math.max(1, Math.floor(startPage)),
      startTimeMs: Date.now(),
      currentPage: Math.max(1, Math.floor(startPage)),
      isActive: true,
    };
  },

  calculatePagesRead(startPage: number, endPage: number): number {
    const start = Math.max(1, Math.floor(startPage));
    const end = Math.max(1, Math.floor(endPage));
    if (end >= start) {
      return end - start;
    }
    return 0;
  },

  calculateDuration(startTimeMs: number, endTimeMs: number): number {
    const seconds = Math.floor((endTimeMs - startTimeMs) / 1000);
    return Math.max(0, seconds);
  },

  shouldSaveSession(durationSeconds: number, pagesRead: number): boolean {
    return durationSeconds >= 60 || pagesRead > 0;
  },

  mapFocusToLevel(focus: SessionFocusOption | null | undefined): number | null {
    if (!focus) {
      return null;
    }
    return FOCUS_TO_LEVEL[focus];
  },

  mapMoodToDb(mood: SessionMoodOption | null | undefined): Mood | null {
    if (!mood) {
      return null;
    }
    return MOOD_TO_DB[mood];
  },

  mapBlockerToDb(blocker: SessionBlockerOption | null | undefined): string | null {
    if (!blocker) {
      return null;
    }
    return BLOCKER_LABELS[blocker];
  },

  async finishSession(input: FinishSessionInput): Promise<SessionSaveResult> {
    const book = await BookRepository.getBookById(input.bookId);
    if (!book) {
      throw new ReadingSessionError('Book not found.');
    }

    const startPage = Math.max(1, Math.floor(input.startPage));
    const endPage = Math.max(1, Math.floor(input.endPage));
    const durationSeconds = Math.max(0, Math.floor(input.durationSeconds));
    const pagesRead = this.calculatePagesRead(startPage, endPage);

    if (durationSeconds < 0 || pagesRead < 0) {
      throw new ReadingSessionError('Invalid session data.');
    }

    const session: ReadingSession = {
      id: await generateId(),
      bookId: input.bookId,
      startPage,
      endPage,
      pagesRead,
      durationSeconds,
      focusLevel: this.mapFocusToLevel(input.focus),
      mood: this.mapMoodToDb(input.mood),
      blockerReason: this.mapBlockerToDb(input.blocker),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...emptySyncMetadata(),
    };

    await SessionRepository.createSession(session);
    void SyncEnqueueService.onSessionCreated(session.id);

    return {
      sessionId: session.id,
      pagesRead,
      durationSeconds,
      startPage,
      endPage,
    };
  },

  async getBookSessions(bookId: string): Promise<ReadingSession[]> {
    return SessionRepository.getSessionsByBookId(bookId);
  },

  async getTodayReadingSummary(): Promise<TodayReadingSummary> {
    const { start, end } = getTodayBounds();
    const sessions = await SessionRepository.getTodaySessions(start, end);
    return this.summarizeSessions(sessions);
  },

  async getReadingStatsSummary(): Promise<ReadingStatsSummary> {
    const all = await SessionRepository.getAllSessions();
    const { start, end } = getTodayBounds();
    const today = all.filter((s) => s.createdAt >= start && s.createdAt < end);
    const totals = this.summarizeSessions(all);
    const todayTotals = this.summarizeSessions(today);

    return {
      totalSessions: all.length,
      totalMinutes: totals.totalMinutes,
      totalPages: totals.totalPages,
      todayMinutes: todayTotals.totalMinutes,
      todayPages: todayTotals.totalPages,
    };
  },

  summarizeSessions(sessions: ReadingSession[]): TodayReadingSummary {
    const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    const totalPages = sessions.reduce((sum, s) => sum + s.pagesRead, 0);
    return {
      totalMinutes: Math.round(totalSeconds / 60),
      totalPages,
      sessionCount: sessions.length,
    };
  },

  formatSaveSuccessMessage(result: SessionSaveResult): string {
    const minutes = Math.max(1, Math.round(result.durationSeconds / 60));
    const minuteLabel = minutes === 1 ? 'minute' : 'minutes';
    if (result.pagesRead > 0) {
      return `Session saved. You read for ${minutes} ${minuteLabel} and moved from page ${result.startPage} to ${result.endPage}.`;
    }
    return `Session saved. You read for ${minutes} ${minuteLabel} on page ${result.endPage}.`;
  },
};
