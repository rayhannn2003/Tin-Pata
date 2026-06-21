/** v2.0B — sync metadata columns for future cloud sync (no sync worker yet). */
export const MIGRATION_V5 = `
ALTER TABLE books ADD COLUMN user_id TEXT;
ALTER TABLE books ADD COLUMN device_id TEXT;
ALTER TABLE books ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE books ADD COLUMN last_synced_at TEXT;
ALTER TABLE books ADD COLUMN deleted_at TEXT;
ALTER TABLE books ADD COLUMN current_page_updated_at TEXT;

ALTER TABLE reading_sessions ADD COLUMN user_id TEXT;
ALTER TABLE reading_sessions ADD COLUMN device_id TEXT;
ALTER TABLE reading_sessions ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE reading_sessions ADD COLUMN last_synced_at TEXT;
ALTER TABLE reading_sessions ADD COLUMN updated_at TEXT;
ALTER TABLE reading_sessions ADD COLUMN deleted_at TEXT;

ALTER TABLE bookmarks ADD COLUMN user_id TEXT;
ALTER TABLE bookmarks ADD COLUMN device_id TEXT;
ALTER TABLE bookmarks ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE bookmarks ADD COLUMN last_synced_at TEXT;
ALTER TABLE bookmarks ADD COLUMN updated_at TEXT;
ALTER TABLE bookmarks ADD COLUMN deleted_at TEXT;

ALTER TABLE notes ADD COLUMN user_id TEXT;
ALTER TABLE notes ADD COLUMN device_id TEXT;
ALTER TABLE notes ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE notes ADD COLUMN last_synced_at TEXT;
ALTER TABLE notes ADD COLUMN deleted_at TEXT;

ALTER TABLE daily_goals ADD COLUMN user_id TEXT;
ALTER TABLE daily_goals ADD COLUMN device_id TEXT;
ALTER TABLE daily_goals ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE daily_goals ADD COLUMN last_synced_at TEXT;
ALTER TABLE daily_goals ADD COLUMN updated_at TEXT;
ALTER TABLE daily_goals ADD COLUMN deleted_at TEXT;

ALTER TABLE reflections ADD COLUMN user_id TEXT;
ALTER TABLE reflections ADD COLUMN device_id TEXT;
ALTER TABLE reflections ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'local';
ALTER TABLE reflections ADD COLUMN last_synced_at TEXT;
ALTER TABLE reflections ADD COLUMN updated_at TEXT;
ALTER TABLE reflections ADD COLUMN deleted_at TEXT;

UPDATE books SET sync_status = 'local' WHERE sync_status IS NULL;
UPDATE books SET current_page_updated_at = updated_at WHERE current_page_updated_at IS NULL;

UPDATE reading_sessions SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE reading_sessions SET sync_status = 'local' WHERE sync_status IS NULL;

UPDATE bookmarks SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE bookmarks SET sync_status = 'local' WHERE sync_status IS NULL;

UPDATE notes SET sync_status = 'local' WHERE sync_status IS NULL;

UPDATE daily_goals SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE daily_goals SET sync_status = 'local' WHERE sync_status IS NULL;

UPDATE reflections SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE reflections SET sync_status = 'local' WHERE sync_status IS NULL;
`;
