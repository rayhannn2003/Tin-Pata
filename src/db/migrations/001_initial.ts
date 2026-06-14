export const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS books (
  id                      TEXT PRIMARY KEY NOT NULL,
  title                   TEXT NOT NULL,
  author                  TEXT,
  local_uri               TEXT NOT NULL,
  file_name               TEXT NOT NULL,
  file_size               INTEGER NOT NULL DEFAULT 0,
  cloudinary_public_id    TEXT,
  cloudinary_asset_id     TEXT,
  total_pages             INTEGER NOT NULL DEFAULT 0,
  current_page            INTEGER NOT NULL DEFAULT 1,
  status                  TEXT NOT NULL DEFAULT 'not_started'
                            CHECK (status IN ('not_started', 'reading', 'paused', 'finished')),
  is_uploaded             INTEGER NOT NULL DEFAULT 0,
  is_downloaded           INTEGER NOT NULL DEFAULT 1,
  created_at              TEXT NOT NULL,
  updated_at              TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_status ON books (status);
CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books (updated_at DESC);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id                TEXT PRIMARY KEY NOT NULL,
  book_id           TEXT NOT NULL,
  start_page        INTEGER NOT NULL,
  end_page          INTEGER NOT NULL,
  pages_read        INTEGER NOT NULL DEFAULT 0,
  duration_seconds  INTEGER NOT NULL DEFAULT 0,
  focus_level       INTEGER CHECK (focus_level IS NULL OR (focus_level >= 1 AND focus_level <= 5)),
  mood              TEXT CHECK (mood IS NULL OR mood IN ('calm', 'tired', 'motivated', 'distracted', 'stuck')),
  blocker_reason    TEXT,
  created_at        TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_book_id ON reading_sessions (book_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON reading_sessions (created_at);

CREATE TABLE IF NOT EXISTS bookmarks (
  id           TEXT PRIMARY KEY NOT NULL,
  book_id      TEXT NOT NULL,
  page_number  INTEGER NOT NULL,
  title        TEXT,
  created_at   TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks (book_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_book_page ON bookmarks (book_id, page_number);

CREATE TABLE IF NOT EXISTS notes (
  id           TEXT PRIMARY KEY NOT NULL,
  book_id      TEXT NOT NULL,
  page_number  INTEGER NOT NULL,
  note_text    TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_book_id ON notes (book_id);
CREATE INDEX IF NOT EXISTS idx_notes_book_page ON notes (book_id, page_number);

CREATE TABLE IF NOT EXISTS daily_goals (
  id            TEXT PRIMARY KEY NOT NULL,
  goal_type     TEXT NOT NULL CHECK (goal_type IN ('pages', 'minutes')),
  target_value  INTEGER NOT NULL CHECK (target_value > 0),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_goals_active ON daily_goals (is_active);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY NOT NULL,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
`;

export const MIGRATIONS: { version: number; sql: string }[] = [
  { version: 1, sql: MIGRATION_V1 },
];
