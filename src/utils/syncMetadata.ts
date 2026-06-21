import type { SyncMetadata, SyncStatus, SyncableEntity } from '@/types/sync';

export const DEFAULT_SYNC_STATUS: SyncStatus = 'local';

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseSyncStatus(value: unknown): SyncStatus {
  if (
    typeof value === 'string' &&
    (['local', 'pending', 'synced', 'error', 'conflict'] as const).includes(value as SyncStatus)
  ) {
    return value as SyncStatus;
  }
  return DEFAULT_SYNC_STATUS;
}

export function createSyncMetadata(deviceId: string): SyncMetadata {
  return {
    userId: null,
    deviceId,
    syncStatus: DEFAULT_SYNC_STATUS,
    lastSyncedAt: null,
    deletedAt: null,
  };
}

/** Defaults for new local entities before repository write stamps device_id. */
export function emptySyncMetadata(): SyncMetadata {
  return {
    userId: null,
    deviceId: null,
    syncStatus: DEFAULT_SYNC_STATUS,
    lastSyncedAt: null,
    deletedAt: null,
  };
}

export function markPendingSync(existing: SyncMetadata, deviceId: string): SyncMetadata {
  return {
    ...existing,
    deviceId,
    syncStatus: 'pending',
    lastSyncedAt: existing.lastSyncedAt,
    deletedAt: null,
  };
}

export function markSynced(existing: SyncMetadata, timestamp: string): SyncMetadata {
  return {
    ...existing,
    syncStatus: 'synced',
    lastSyncedAt: timestamp,
    deletedAt: null,
  };
}

export function markDeleted(existing: SyncMetadata, deviceId: string): SyncMetadata {
  return {
    ...existing,
    deviceId,
    syncStatus: 'pending',
    deletedAt: nowIso(),
  };
}

export function isSyncableDeleted(row: Pick<SyncMetadata, 'deletedAt'>): boolean {
  return Boolean(row.deletedAt);
}

/** Import restores IDs but re-stamps device + local sync state (never import remote user_id). */
export function stampImportedLocalSync<T extends SyncMetadata>(
  record: T,
  deviceId: string,
): T {
  return {
    ...record,
    userId: null,
    deviceId,
    syncStatus: DEFAULT_SYNC_STATUS,
    lastSyncedAt: null,
    deletedAt: null,
  };
}

export function shortenDeviceId(deviceId: string): string {
  if (deviceId.length <= 12) {
    return deviceId;
  }
  return `${deviceId.slice(0, 8)}…${deviceId.slice(-4)}`;
}

export function mapSyncFromRow(row: {
  user_id?: string | null;
  device_id?: string | null;
  sync_status?: string | null;
  last_synced_at?: string | null;
  deleted_at?: string | null;
}): SyncMetadata {
  return {
    userId: row.user_id ?? null,
    deviceId: row.device_id ?? null,
    syncStatus: parseSyncStatus(row.sync_status),
    lastSyncedAt: row.last_synced_at ?? null,
    deletedAt: row.deleted_at ?? null,
  };
}

export function hasSyncableId(record: SyncableEntity): boolean {
  return record.id.length > 0;
}
