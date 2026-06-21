export const SYNC_STATUSES = ['local', 'pending', 'synced', 'error', 'conflict'] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export const SYNC_QUEUE_OPERATIONS = ['upsert', 'delete'] as const;
export type SyncQueueOperation = (typeof SYNC_QUEUE_OPERATIONS)[number];

export const SYNC_QUEUE_STATUSES = ['pending', 'processing', 'synced', 'error'] as const;
export type SyncQueueStatus = (typeof SYNC_QUEUE_STATUSES)[number];

export const SYNC_ENTITY_TYPES = [
  'books',
  'reading_sessions',
  'notes',
  'bookmarks',
  'daily_goals',
  'reflections',
  'user_settings',
] as const;

export type SyncEntityType = (typeof SYNC_ENTITY_TYPES)[number];

export const SYNC_ENGINE_STATES = [
  'not_enabled',
  'ready',
  'syncing',
  'synced',
  'error',
] as const;

export type SyncEngineState = (typeof SYNC_ENGINE_STATES)[number];

export interface SyncMetadata {
  userId: string | null;
  deviceId: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  deletedAt: string | null;
}

/** Row with id + sync columns — used for sync preparation helpers. */
export interface SyncableEntity extends SyncMetadata {
  id: string;
}

export interface DeviceIdentity {
  deviceId: string;
  createdAt: string;
}

export interface LocalSyncSummary {
  deviceId: string;
  deviceIdShort: string;
  syncReadyRecordCount: number;
  localOnlyRowCount: number;
  cloudSyncEnabled: boolean;
  isLinked: boolean;
}

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncQueueOperation;
  payload: string | null;
  status: SyncQueueStatus;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEngineStatus {
  state: SyncEngineState;
  isLinked: boolean;
  pendingCount: number;
  failedCount: number;
  processingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface SyncIntegrityIssue {
  code: string;
  message: string;
  count?: number;
}

export interface SyncIntegrityReport {
  ok: boolean;
  warnings: SyncIntegrityIssue[];
  errors: SyncIntegrityIssue[];
  counts: {
    pendingQueue: number;
    failedQueue: number;
    processingQueue: number;
    syncedQueue: number;
    orphanedNotes: number;
    orphanedBookmarks: number;
    duplicateIds: number;
    invalidSyncStatus: number;
    cloudFlagMismatch: number;
    localPdfMissingCloudAvailable: number;
    localPdfMissingNoCloud: number;
  };
}

export interface SyncRepairResult {
  retriedFailed: number;
  clearedSynced: number;
  normalizedSyncStatus: number;
  refreshedCloudFlags: number;
  reEnqueued: number;
  resetStuckProcessing: number;
}

export interface SyncPushResult {
  pushed: number;
  failed: number;
  errors: string[];
}

export interface LinkLocalDataResult {
  rowsLinked: number;
  enqueued: number;
}
