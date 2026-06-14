import { getDatabase } from '@/db/database';
import type { DailyGoal, GoalType } from '@/types';

interface GoalRow {
  id: string;
  goal_type: GoalType;
  target_value: number;
  is_active: number;
  created_at: string;
}

function mapRow(row: GoalRow): DailyGoal {
  return {
    id: row.id,
    goalType: row.goal_type,
    targetValue: row.target_value,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

export const GoalRepository = {
  async getActiveGoal(): Promise<DailyGoal | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<GoalRow>(
      'SELECT * FROM daily_goals WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1',
    );
    return row ? mapRow(row) : null;
  },

  async createGoal(goal: DailyGoal): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO daily_goals (id, goal_type, target_value, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
      goal.id,
      goal.goalType,
      goal.targetValue,
      goal.isActive ? 1 : 0,
      goal.createdAt,
    );
  },

  async updateGoal(id: string, fields: Partial<Pick<DailyGoal, 'goalType' | 'targetValue' | 'isActive'>>): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<GoalRow>(
      'SELECT * FROM daily_goals WHERE id = ?',
      id,
    );
    if (!existing) {
      return;
    }

    const goalType = fields.goalType ?? existing.goal_type;
    const targetValue = fields.targetValue ?? existing.target_value;
    const isActive = fields.isActive !== undefined ? (fields.isActive ? 1 : 0) : existing.is_active;

    await db.runAsync(
      'UPDATE daily_goals SET goal_type = ?, target_value = ?, is_active = ? WHERE id = ?',
      goalType,
      targetValue,
      isActive,
      id,
    );
  },

  async deactivateAllGoals(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE daily_goals SET is_active = 0 WHERE is_active = 1');
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
