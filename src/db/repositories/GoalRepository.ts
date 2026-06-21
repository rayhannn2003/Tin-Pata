import { withDatabase } from '@/db/database';
import { getLocalWriteSyncFields } from '@/db/syncWriteHelpers';
import type { DailyGoal, GoalType } from '@/types';
import { mapSyncFromRow } from '@/utils/syncMetadata';

interface GoalRow {
  id: string;
  goal_type: GoalType;
  target_value: number;
  is_active: number;
  created_at: string;
  updated_at: string | null;
  user_id: string | null;
  device_id: string | null;
  sync_status: string | null;
  last_synced_at: string | null;
  deleted_at: string | null;
}

function mapRow(row: GoalRow): DailyGoal {
  return {
    id: row.id,
    goalType: row.goal_type,
    targetValue: row.target_value,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    ...mapSyncFromRow(row),
  };
}

export const GoalRepository = {
  async getAllGoals(): Promise<DailyGoal[]> {
    return withDatabase(async (db) => {
      const rows = await db.getAllAsync<GoalRow>(
        'SELECT * FROM daily_goals WHERE deleted_at IS NULL ORDER BY created_at ASC',
      );
      return rows.map(mapRow);
    });
  },

  async getActiveGoal(): Promise<DailyGoal | null> {
    return withDatabase(async (db) => {
      const row = await db.getFirstAsync<GoalRow>(
        'SELECT * FROM daily_goals WHERE is_active = 1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1',
      );
      return row ? mapRow(row) : null;
    });
  },

  async createGoal(goal: DailyGoal): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      await db.runAsync(
        `INSERT INTO daily_goals (
          id, goal_type, target_value, is_active, created_at,
          user_id, device_id, sync_status, last_synced_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        goal.id,
        goal.goalType,
        goal.targetValue,
        goal.isActive ? 1 : 0,
        goal.createdAt,
        goal.userId ?? sync.userId,
        sync.deviceId,
        sync.syncStatus,
        goal.lastSyncedAt,
        sync.updatedAt,
        null,
      );
    });
  },

  async updateGoal(
    id: string,
    fields: Partial<Pick<DailyGoal, 'goalType' | 'targetValue' | 'isActive'>>,
  ): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      const existing = await db.getFirstAsync<GoalRow>(
        'SELECT * FROM daily_goals WHERE id = ?',
        id,
      );
      if (!existing) {
        return;
      }

      const goalType = fields.goalType ?? existing.goal_type;
      const targetValue = fields.targetValue ?? existing.target_value;
      const isActive =
        fields.isActive !== undefined ? (fields.isActive ? 1 : 0) : existing.is_active;

      await db.runAsync(
        `UPDATE daily_goals SET
          goal_type = ?, target_value = ?, is_active = ?,
          updated_at = ?, device_id = ?, sync_status = ?
         WHERE id = ?`,
        goalType,
        targetValue,
        isActive,
        sync.updatedAt,
        sync.deviceId,
        sync.syncStatus,
        id,
      );
    });
  },

  async deactivateAllGoals(): Promise<void> {
    const sync = await getLocalWriteSyncFields();
    await withDatabase(async (db) => {
      await db.runAsync(
        `UPDATE daily_goals SET is_active = 0, updated_at = ?, device_id = ?, sync_status = ?
         WHERE is_active = 1 AND deleted_at IS NULL`,
        sync.updatedAt,
        sync.deviceId,
        sync.syncStatus,
      );
    });
  },

  async setActiveGoal(goal: DailyGoal): Promise<void> {
    await this.deactivateAllGoals();
    await this.createGoal({ ...goal, isActive: true });
  },

  /** @deprecated Use getActiveGoal */
  async findActive(): Promise<DailyGoal | null> {
    return this.getActiveGoal();
  },

  /** @deprecated Use createGoal */
  async insert(goal: DailyGoal): Promise<void> {
    return this.createGoal(goal);
  },

  /** @deprecated Use deactivateAllGoals */
  async deactivateAll(): Promise<void> {
    return this.deactivateAllGoals();
  },
};
