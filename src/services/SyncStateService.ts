import { withDatabase } from '@/db/database';
import { nowIso } from '@/utils/syncMetadata';

export const LINKED_USER_ID_KEY = 'tin_pata_linked_user_id';
export const LAST_SYNC_AT_KEY = 'tin_pata_last_sync_at';
export const LAST_PULL_AT_KEY = 'tin_pata_last_pull_at';
export const LAST_SYNC_ERROR_KEY = 'tin_pata_last_sync_error';

export const SyncStateService = {
  async get(key: string): Promise<string | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM sync_state WHERE key = ?',
        key,
      );
      return row?.value ?? null;
    });
  },

  async set(key: string, value: string): Promise<void> {
    const updatedAt = nowIso();
    await withDatabase(async (db) => {
      await db.runAsync(
        `INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        key,
        value,
        updatedAt,
      );
    });
  },

  async remove(key: string): Promise<void> {
    await withDatabase(async (db) => {
      await db.runAsync('DELETE FROM sync_state WHERE key = ?', key);
    });
  },

  async getLinkedUserId(): Promise<string | null> {
    const value = await this.get(LINKED_USER_ID_KEY);
    return value?.trim() ? value.trim() : null;
  },

  async setLinkedUserId(userId: string): Promise<void> {
    await this.set(LINKED_USER_ID_KEY, userId);
  },

  async clearLinkedUserId(): Promise<void> {
    await this.remove(LINKED_USER_ID_KEY);
  },

  async isLocalDataLinked(expectedUserId?: string | null): Promise<boolean> {
    const linked = await this.getLinkedUserId();
    if (!linked) {
      return false;
    }
    if (expectedUserId && linked !== expectedUserId) {
      return false;
    }
    return true;
  },

  async getLastSyncAt(): Promise<string | null> {
    return this.get(LAST_SYNC_AT_KEY);
  },

  async setLastSyncAt(iso: string): Promise<void> {
    await this.set(LAST_SYNC_AT_KEY, iso);
    await this.remove(LAST_SYNC_ERROR_KEY);
  },

  async getLastPullAt(): Promise<string | null> {
    return this.get(LAST_PULL_AT_KEY);
  },

  async setLastPullAt(iso: string): Promise<void> {
    await this.set(LAST_PULL_AT_KEY, iso);
  },

  async setLastSyncError(message: string): Promise<void> {
    await this.set(LAST_SYNC_ERROR_KEY, message);
  },

  async getLastSyncError(): Promise<string | null> {
    return this.get(LAST_SYNC_ERROR_KEY);
  },

  /** Clears sync timestamps/errors only — does not clear linked user id. */
  async resetSyncStateForDebug(): Promise<void> {
    await Promise.all([
      this.remove(LAST_SYNC_AT_KEY),
      this.remove(LAST_PULL_AT_KEY),
      this.remove(LAST_SYNC_ERROR_KEY),
    ]);
  },
};
