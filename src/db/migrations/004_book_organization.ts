/** v1.2A — category/priority defaults only; validation is app-layer (see parseBookCategory). */
export const MIGRATION_V4 = `
ALTER TABLE books ADD COLUMN category TEXT NOT NULL DEFAULT 'general';
ALTER TABLE books ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';

CREATE INDEX IF NOT EXISTS idx_books_category ON books (category);
CREATE INDEX IF NOT EXISTS idx_books_priority ON books (priority);
`;
