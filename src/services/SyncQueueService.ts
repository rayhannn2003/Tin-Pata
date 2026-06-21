import { SyncQueueRepository } from '@/db/repositories/SyncQueueRepository';
import type { SyncEntityType, SyncQueueOperation } from '@/types/sync';
import { generateId } from '@/utils/ids';
import { nowIso } from '@/utils/syncMetadata';

export const SyncQueueService = {
  async enqueueUpsert(
    entityType: SyncEntityType,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await SyncQueueRepository.removePendingForEntity(entityType, entityId);
    await SyncQueueRepository.insert({
      id: await generateId(),
      entityType,
      entityId,
      operation: 'upsert',
      payload: JSON.stringify(payload),
      status: 'pending',
    });
  },

  async enqueueDelete(entityType: SyncEntityType, entityId: string): Promise<void> {
    await SyncQueueRepository.removePendingForEntity(entityType, entityId);
    await SyncQueueRepository.insert({
      id: await generateId(),
      entityType,
      entityId,
      operation: 'delete',
      payload: null,
      status: 'pending',
    });
  },

  async getPending(limit = 50) {
    return SyncQueueRepository.getPending(limit);
  },

  async countPending(): Promise<number> {
    return SyncQueueRepository.countPending();
  },

  async countFailed(): Promise<number> {
    return SyncQueueRepository.countFailed();
  },

  async countProcessing(): Promise<number> {
    return SyncQueueRepository.countProcessing();
  },

  async countSynced(): Promise<number> {
    return SyncQueueRepository.countSynced();
  },

  async resetStuckProcessing(maxAgeMinutes = 30): Promise<number> {
    return SyncQueueRepository.resetStuckProcessing(maxAgeMinutes);
  },

  async markProcessing(id: string): Promise<void> {
    return SyncQueueRepository.markProcessing(id);
  },

  async markSynced(id: string): Promise<void> {
    return SyncQueueRepository.markSynced(id);
  },

  async markError(id: string, error: string): Promise<void> {
    return SyncQueueRepository.markError(id, error);
  },

  async retryErrors(): Promise<number> {
    return SyncQueueRepository.retryErrors();
  },

  async clearSynced(): Promise<number> {
    return SyncQueueRepository.clearSynced();
  },

  async enqueueRaw(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncQueueOperation,
    payload: Record<string, unknown> | null,
  ): Promise<void> {
    if (operation === 'upsert' && payload) {
      await this.enqueueUpsert(entityType, entityId, payload);
      return;
    }
    await this.enqueueDelete(entityType, entityId);
  },
};
