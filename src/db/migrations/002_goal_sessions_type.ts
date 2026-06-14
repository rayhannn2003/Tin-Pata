/** Allow 'sessions' goal type in daily_goals (SQLite CHECK rebuild). */
export const MIGRATION_V2 = `
CREATE TABLE IF NOT EXISTS daily_goals_new (
  id            TEXT PRIMARY KEY NOT NULL,
  goal_type     TEXT NOT NULL CHECK (goal_type IN ('pages', 'minutes', 'sessions')),
  target_value  INTEGER NOT NULL CHECK (target_value > 0),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

INSERT INTO daily_goals_new (id, goal_type, target_value, is_active, created_at)
SELECT id, goal_type, target_value, is_active, created_at FROM daily_goals;

DROP TABLE daily_goals;

ALTER TABLE daily_goals_new RENAME TO daily_goals;

CREATE INDEX IF NOT EXISTS idx_daily_goals_active ON daily_goals (is_active);
`;
