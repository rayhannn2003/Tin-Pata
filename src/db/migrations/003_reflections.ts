/** Stuck reflections for Reader's Block Rescue. */
export const MIGRATION_V3 = `
CREATE TABLE IF NOT EXISTS reflections (
  id          TEXT PRIMARY KEY NOT NULL,
  text        TEXT NOT NULL,
  book_id     TEXT,
  created_at  TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reflections_created_at ON reflections (created_at DESC);
`;
