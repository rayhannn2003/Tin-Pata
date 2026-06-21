import { Platform } from 'react-native';

import { getSupabaseClient, isSupabaseAuthReady } from '@/lib/supabase';
import { AuthService } from '@/services/AuthService';
import { DeviceIdentityService } from '@/services/DeviceIdentityService';
import { SyncApplyService } from '@/services/SyncApplyService';
import { SyncIntegrityService } from '@/services/SyncIntegrityService';
import { SyncQueueService } from '@/services/SyncQueueService';
import { SyncRepairService } from '@/services/SyncRepairService';
import { SyncStateService } from '@/services/SyncStateService';
import type { SyncEngineStatus, SyncEntityType, SyncIntegrityReport, SyncPushResult } from '@/types/sync';
import { friendlySyncError } from '@/utils/syncConflict';
import { entityTypeToTable } from '@/utils/syncRemoteMappers';
import { nowIso } from '@/utils/syncMetadata';

const PULL_TABLES: SyncEntityType[] = [
  'books',
  'reading_sessions',
  'notes',
  'bookmarks',
  'daily_goals',
  'reflections',
  'user_settings',
];

let syncing = false;

export class SyncEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SyncEngineError';
  }
}

async function assertSyncReady(): Promise<{ userId: string; deviceId: string }> {
  if (!isSupabaseAuthReady()) {
    throw new SyncEngineError('Cloud sync is not configured.');
  }

  const user = await AuthService.getCurrentUser();
  if (!user) {
    throw new SyncEngineError('Sign in to sync.');
  }

  const linked = await SyncStateService.isLocalDataLinked(user.id);
  if (!linked) {
    throw new SyncEngineError('Local data is not linked to this account yet.');
  }

  const deviceId = await DeviceIdentityService.getOrCreateDeviceId();
  return { userId: user.id, deviceId };
}

export const SyncEngineService = {
  async getSyncStatus(): Promise<SyncEngineStatus> {
    const user = await AuthService.getCurrentUser();
    const isLinked = user ? await SyncStateService.isLocalDataLinked(user.id) : false;
    const [pendingCount, failedCount, processingCount, lastSyncAt, lastError] = await Promise.all([
      SyncQueueService.countPending(),
      SyncQueueService.countFailed(),
      SyncQueueService.countProcessing(),
      SyncStateService.getLastSyncAt(),
      SyncStateService.getLastSyncError(),
    ]);

    if (!isSupabaseAuthReady() || !user) {
      return {
        state: 'not_enabled',
        isLinked: false,
        pendingCount,
        failedCount,
        processingCount,
        lastSyncAt,
        lastError,
      };
    }

    if (!isLinked) {
      return {
        state: 'ready',
        isLinked: false,
        pendingCount,
        failedCount,
        processingCount,
        lastSyncAt,
        lastError,
      };
    }

    if (syncing) {
      return {
        state: 'syncing',
        isLinked: true,
        pendingCount,
        failedCount,
        processingCount,
        lastSyncAt,
        lastError,
      };
    }

    if (failedCount > 0 || lastError) {
      return {
        state: 'error',
        isLinked: true,
        pendingCount,
        failedCount,
        processingCount,
        lastSyncAt,
        lastError,
      };
    }

    if (pendingCount > 0 || processingCount > 0) {
      return {
        state: 'ready',
        isLinked: true,
        pendingCount,
        failedCount,
        processingCount,
        lastSyncAt,
        lastError,
      };
    }

    return {
      state: lastSyncAt ? 'synced' : 'ready',
      isLinked: true,
      pendingCount,
      failedCount,
      processingCount,
      lastSyncAt,
      lastError,
    };
  },

  async registerDevice(userId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) {
      return;
    }

    const deviceId = await DeviceIdentityService.getOrCreateDeviceId();
    const now = nowIso();
    await client.from('devices').upsert(
      {
        id: deviceId,
        user_id: userId,
        platform: Platform.OS,
        updated_at: now,
        last_seen_at: now,
      },
      { onConflict: 'id' },
    );
  },

  async pushPendingChanges(): Promise<SyncPushResult> {
    const { userId } = await assertSyncReady();
    const client = getSupabaseClient();
    if (!client) {
      throw new SyncEngineError('Cloud sync is not configured.');
    }

    await SyncRepairService.resetStuckProcessing();

    const pending = await SyncQueueService.getPending(50);
    let pushed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of pending) {
      await SyncQueueService.markProcessing(item.id);

      try {
        const table = entityTypeToTable(item.entityType);

        if (item.operation === 'delete') {
          const deletedAt = nowIso();
          let error;
          if (item.entityType === 'user_settings') {
            ({ error } = await client
              .from(table)
              .update({ deleted_at: deletedAt, updated_at: deletedAt })
              .eq('setting_key', item.entityId)
              .eq('user_id', userId));
          } else {
            ({ error } = await client
              .from(table)
              .update({ deleted_at: deletedAt, updated_at: deletedAt })
              .eq('id', item.entityId)
              .eq('user_id', userId));
          }

          if (error) {
            throw new SyncEngineError(error.message);
          }
        } else {
          const payload = item.payload ? (JSON.parse(item.payload) as Record<string, unknown>) : null;
          if (!payload) {
            throw new SyncEngineError('Missing sync payload.');
          }

          const { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
          if (error) {
            throw new SyncEngineError(error.message);
          }
        }

        await SyncApplyService.markEntitySynced(item.entityType, item.entityId);
        await SyncQueueService.markSynced(item.id);
        pushed += 1;
      } catch (error) {
        const message = friendlySyncError(error);
        await SyncQueueService.markError(item.id, message);
        failed += 1;
        if (!errors.includes(message)) {
          errors.push(message);
        }
      }
    }

    return { pushed, failed, errors };
  },

  async pullRemoteChanges(): Promise<number> {
    const { userId } = await assertSyncReady();
    const client = getSupabaseClient();
    if (!client) {
      throw new SyncEngineError('Cloud sync is not configured.');
    }

    const lastPullAt = (await SyncStateService.getLastPullAt()) ?? '1970-01-01T00:00:00.000Z';
    let applied = 0;

    for (const entityType of PULL_TABLES) {
      const table = entityTypeToTable(entityType);
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', lastPullAt)
        .order('updated_at', { ascending: true });

      if (error) {
        throw new SyncEngineError(friendlySyncError(error));
      }

      for (const row of data ?? []) {
        const didApply = await SyncApplyService.applyRemoteRow(entityType, row as Record<string, unknown>);
        if (didApply) {
          applied += 1;
        }
      }
    }

    await SyncStateService.setLastPullAt(nowIso());
    return applied;
  },

  async syncNow(): Promise<{ pushed: number; pulled: number; failed: number }> {
    if (syncing) {
      throw new SyncEngineError('Sync already in progress.');
    }

    syncing = true;
    try {
      const { userId } = await assertSyncReady();
      await this.registerDevice(userId);

      const pushResult = await this.pushPendingChanges();
      let pulled = 0;
      let pullError: string | null = null;

      try {
        pulled = await this.pullRemoteChanges();
      } catch (error) {
        pullError = friendlySyncError(error);
      }

      const hasFailures = pushResult.failed > 0 || Boolean(pullError);
      if (hasFailures) {
        const messages = [...pushResult.errors];
        if (pullError) {
          messages.push(pullError);
        }
        await SyncStateService.setLastSyncError(messages[0] ?? 'Sync completed with errors.');
      } else {
        await SyncStateService.setLastSyncAt(nowIso());
      }

      await SyncQueueService.clearSynced();
      return { pushed: pushResult.pushed, pulled, failed: pushResult.failed + (pullError ? 1 : 0) };
    } catch (error) {
      const message = friendlySyncError(error);
      await SyncStateService.setLastSyncError(message);
      throw error instanceof SyncEngineError ? error : new SyncEngineError(message);
    } finally {
      syncing = false;
    }
  },

  async retryFailedSync(): Promise<SyncPushResult> {
    await SyncRepairService.retryFailedQueue();
    return this.pushPendingChanges();
  },

  async runSyncCheck(): Promise<SyncIntegrityReport> {
    return SyncIntegrityService.runSyncCheck();
  },

  async runSafeRepairs(report?: SyncIntegrityReport) {
    return SyncRepairService.runSafeRepairs(report);
  },

  async clearSyncedQueueItems(): Promise<number> {
    return SyncRepairService.clearSyncedQueue();
  },

  async resetSyncStateForDebug(): Promise<void> {
    await SyncStateService.resetSyncStateForDebug();
    await SyncQueueService.clearSynced();
  },
};
