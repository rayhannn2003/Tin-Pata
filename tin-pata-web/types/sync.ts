export type SyncStatus = 'local' | 'pending' | 'synced' | 'error' | 'conflict';

export interface SyncMetadata {
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  updatedAt: string;
}
