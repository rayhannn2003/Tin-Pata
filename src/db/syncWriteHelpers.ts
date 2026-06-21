import { DeviceIdentityService } from '@/services/DeviceIdentityService';
import { SyncStateService } from '@/services/SyncStateService';
import type { SyncStatus } from '@/types/sync';
import { DEFAULT_SYNC_STATUS, nowIso } from '@/utils/syncMetadata';

export interface LocalWriteSyncFields {
  deviceId: string;
  syncStatus: SyncStatus;
  updatedAt: string;
  userId: string | null;
}

export async function getLocalWriteSyncFields(): Promise<LocalWriteSyncFields> {
  const deviceId = await DeviceIdentityService.getOrCreateDeviceId();
  const linkedUserId = await SyncStateService.getLinkedUserId();
  return {
    deviceId,
    syncStatus: linkedUserId ? 'pending' : DEFAULT_SYNC_STATUS,
    updatedAt: nowIso(),
    userId: linkedUserId,
  };
}
