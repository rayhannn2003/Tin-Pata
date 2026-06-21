import { BookmarkRepository } from '@/db/repositories/BookmarkRepository';
import { BookRepository } from '@/db/repositories/BookRepository';
import { GoalRepository } from '@/db/repositories/GoalRepository';
import { NoteRepository } from '@/db/repositories/NoteRepository';
import { ReflectionRepository } from '@/db/repositories/ReflectionRepository';
import { SessionRepository } from '@/db/repositories/SessionRepository';
import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { AuthService } from '@/services/AuthService';
import { DeviceIdentityService } from '@/services/DeviceIdentityService';
import { SyncQueueService } from '@/services/SyncQueueService';
import { SyncStateService } from '@/services/SyncStateService';
import type { SyncEntityType } from '@/types/sync';
import {
  SYNCABLE_SETTING_KEYS,
  bookToRemotePayload,
  bookmarkToRemotePayload,
  goalToRemotePayload,
  noteToRemotePayload,
  reflectionToRemotePayload,
  sessionToRemotePayload,
  settingToRemotePayload,
} from '@/utils/syncRemoteMappers';

let applyingRemote = false;

export function isApplyingRemoteSync(): boolean {
  return applyingRemote;
}

export function runWithRemoteSyncApply<T>(fn: () => Promise<T>): Promise<T> {
  applyingRemote = true;
  return fn().finally(() => {
    applyingRemote = false;
  });
}

async function canEnqueue(): Promise<{ userId: string; deviceId: string } | null> {
  if (isApplyingRemoteSync()) {
    return null;
  }

  const user = await AuthService.getCurrentUser();
  if (!user) {
    return null;
  }

  const linked = await SyncStateService.isLocalDataLinked(user.id);
  if (!linked) {
    return null;
  }

  const deviceId = await DeviceIdentityService.getOrCreateDeviceId();
  return { userId: user.id, deviceId };
}

export const SyncEnqueueService = {
  async enqueueUpsertForEntity(entityType: SyncEntityType, entityId: string): Promise<void> {
    const ctx = await canEnqueue();
    if (!ctx) {
      return;
    }

    const { userId, deviceId } = ctx;
    let payload: Record<string, unknown> | null = null;

    switch (entityType) {
      case 'books': {
        const book = await BookRepository.getBookById(entityId);
        if (book) {
          payload = bookToRemotePayload(book, userId, deviceId);
        }
        break;
      }
      case 'reading_sessions': {
        const session = await SessionRepository.getSessionById(entityId);
        if (session) {
          payload = sessionToRemotePayload(session, userId, deviceId);
        }
        break;
      }
      case 'notes': {
        const note = await NoteRepository.getNoteById(entityId);
        if (note) {
          payload = noteToRemotePayload(note, userId, deviceId);
        }
        break;
      }
      case 'bookmarks': {
        const bookmark = await BookmarkRepository.getBookmarkById(entityId);
        if (bookmark) {
          payload = bookmarkToRemotePayload(bookmark, userId, deviceId);
        }
        break;
      }
      case 'daily_goals': {
        const goals = await GoalRepository.getAllGoals();
        const goal = goals.find((row) => row.id === entityId);
        if (goal) {
          payload = goalToRemotePayload(goal, userId, deviceId);
        }
        break;
      }
      case 'reflections': {
        const reflections = await ReflectionRepository.getAll();
        const reflection = reflections.find((row) => row.id === entityId);
        if (reflection) {
          payload = reflectionToRemotePayload(reflection, userId, deviceId);
        }
        break;
      }
      case 'user_settings': {
        const value = await SettingsRepository.get(entityId);
        if (value !== null) {
          payload = settingToRemotePayload(entityId, value, userId, deviceId, new Date().toISOString());
        }
        break;
      }
    }

    if (!payload) {
      return;
    }

    await SyncQueueService.enqueueUpsert(entityType, entityId, payload);
  },

  async enqueueDeleteForEntity(entityType: SyncEntityType, entityId: string): Promise<void> {
    const ctx = await canEnqueue();
    if (!ctx) {
      return;
    }
    await SyncQueueService.enqueueDelete(entityType, entityId);
  },

  async onNoteChanged(noteId: string): Promise<void> {
    await this.enqueueUpsertForEntity('notes', noteId);
  },

  async onNoteDeleted(noteId: string): Promise<void> {
    await this.enqueueDeleteForEntity('notes', noteId);
  },

  async onBookmarkChanged(bookmarkId: string): Promise<void> {
    await this.enqueueUpsertForEntity('bookmarks', bookmarkId);
  },

  async onBookmarkDeleted(bookmarkId: string): Promise<void> {
    await this.enqueueDeleteForEntity('bookmarks', bookmarkId);
  },

  async onSessionCreated(sessionId: string): Promise<void> {
    await this.enqueueUpsertForEntity('reading_sessions', sessionId);
  },

  async onBookChanged(bookId: string): Promise<void> {
    await this.enqueueUpsertForEntity('books', bookId);
  },

  async onBookDeleted(bookId: string): Promise<void> {
    await this.enqueueDeleteForEntity('books', bookId);
  },

  async onSettingChanged(key: string, value: string): Promise<void> {
    if (!SYNCABLE_SETTING_KEYS.has(key)) {
      return;
    }
    const ctx = await canEnqueue();
    if (!ctx) {
      return;
    }
    const payload = settingToRemotePayload(key, value, ctx.userId, ctx.deviceId, new Date().toISOString());
    await SyncQueueService.enqueueUpsert('user_settings', key, payload);
  },

  async enqueueAllLinkedEntities(): Promise<number> {
    const ctx = await canEnqueue();
    if (!ctx) {
      return 0;
    }

    const { userId, deviceId } = ctx;
    let count = 0;

    const [books, sessions, notes, bookmarks, goals, reflections, settings] = await Promise.all([
      BookRepository.getAllBooks(),
      SessionRepository.getAllSessions(),
      NoteRepository.getAllNotes(),
      BookmarkRepository.getAllBookmarks(),
      GoalRepository.getAllGoals(),
      ReflectionRepository.getAll(),
      SettingsRepository.getAll(),
    ]);

    for (const book of books) {
      await SyncQueueService.enqueueUpsert('books', book.id, bookToRemotePayload(book, userId, deviceId));
      count += 1;
    }
    for (const session of sessions) {
      await SyncQueueService.enqueueUpsert(
        'reading_sessions',
        session.id,
        sessionToRemotePayload(session, userId, deviceId),
      );
      count += 1;
    }
    for (const note of notes) {
      await SyncQueueService.enqueueUpsert('notes', note.id, noteToRemotePayload(note, userId, deviceId));
      count += 1;
    }
    for (const bookmark of bookmarks) {
      await SyncQueueService.enqueueUpsert(
        'bookmarks',
        bookmark.id,
        bookmarkToRemotePayload(bookmark, userId, deviceId),
      );
      count += 1;
    }
    for (const goal of goals) {
      await SyncQueueService.enqueueUpsert('daily_goals', goal.id, goalToRemotePayload(goal, userId, deviceId));
      count += 1;
    }
    for (const reflection of reflections) {
      await SyncQueueService.enqueueUpsert(
        'reflections',
        reflection.id,
        reflectionToRemotePayload(reflection, userId, deviceId),
      );
      count += 1;
    }
    for (const setting of settings) {
      if (!SYNCABLE_SETTING_KEYS.has(setting.key)) {
        continue;
      }
      await SyncQueueService.enqueueUpsert(
        'user_settings',
        setting.key,
        settingToRemotePayload(setting.key, setting.value, userId, deviceId, setting.updatedAt),
      );
      count += 1;
    }

    return count;
  },
};
