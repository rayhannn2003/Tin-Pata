# Database Schema

SQLite schema for the Reading Habit Tracker. All timestamps are ISO 8601 strings (UTC) or Unix integers — pick one convention at implementation and use consistently. **Recommended: ISO 8601 text** for readability in debugging.

PDF files are **not** stored in the database. See [Storage Strategy](STORAGE_STRATEGY.md).

---

## Entity Relationship Overview

```
books (1) ──< (N) reading_sessions
books (1) ──< (N) bookmarks
books (1) ──< (N) notes

daily_goals — standalone (one active at a time)
settings — key-value store
```

---

## Tables

### books

Stores PDF metadata, file references, and reading progress.

```sql
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
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID generated on import |
| `title` | TEXT | Display name (defaults to filename without extension) |
| `author` | TEXT | Optional; user can set later |
| `local_uri` | TEXT | Full path: `file:///.../pdfs/{id}.pdf` |
| `file_name` | TEXT | Original filename from import |
| `file_size` | INTEGER | Bytes |
| `cloudinary_public_id` | TEXT | Cloudinary public_id after backup (nullable) |
| `cloudinary_asset_id` | TEXT | Cloudinary asset_id (nullable) |
| `total_pages` | INTEGER | Set when PDF is first opened or parsed |
| `current_page` | INTEGER | Last read page (1-indexed) |
| `status` | TEXT | `not_started`, `reading`, `paused`, `finished` |
| `is_uploaded` | INTEGER | 1 if backed up to Cloudinary |
| `is_downloaded` | INTEGER | 1 if local file exists; 0 if cloud-only |
| `created_at` | TEXT | Import timestamp |
| `updated_at` | TEXT | Last modification |

---

### reading_sessions

One row per discrete reading period.

```sql
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
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `book_id` | TEXT FK | Reference to books |
| `start_page` | INTEGER | Page at session start |
| `end_page` | INTEGER | Page at session end |
| `pages_read` | INTEGER | `max(0, end_page - start_page)` |
| `duration_seconds` | INTEGER | Active reading time |
| `focus_level` | INTEGER | Optional 1–5 |
| `mood` | TEXT | Optional enum |
| `blocker_reason` | TEXT | Optional free text |
| `created_at` | TEXT | Session end timestamp |

---

### bookmarks

```sql
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
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `book_id` | TEXT FK | Reference to books |
| `page_number` | INTEGER | Bookmarked page (1-indexed) |
| `title` | TEXT | Optional label; defaults to "Page N" |
| `created_at` | TEXT | Creation timestamp |

> Unique index on `(book_id, page_number)` prevents duplicate bookmarks on same page. Remove if multiple bookmarks per page are desired.

---

### notes

```sql
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
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `book_id` | TEXT FK | Reference to books |
| `page_number` | INTEGER | Page the note refers to |
| `note_text` | TEXT | Plain text content |
| `created_at` | TEXT | Creation timestamp |
| `updated_at` | TEXT | Last edit timestamp |

---

### daily_goals

```sql
CREATE TABLE IF NOT EXISTS daily_goals (
  id            TEXT PRIMARY KEY NOT NULL,
  goal_type     TEXT NOT NULL CHECK (goal_type IN ('pages', 'minutes')),
  target_value  INTEGER NOT NULL CHECK (target_value > 0),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_goals_active ON daily_goals (is_active);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT PK | UUID |
| `goal_type` | TEXT | `pages` or `minutes` |
| `target_value` | INTEGER | Target pages or minutes per day |
| `is_active` | INTEGER | 1 = current goal; 0 = historical |
| `created_at` | TEXT | When goal was set |

Only one row should have `is_active = 1` at a time. Enforce in `GoalService`.

---

### settings

Key-value store for app preferences.

```sql
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY NOT NULL,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

| Column | Type | Description |
|--------|------|-------------|
| `key` | TEXT PK | Setting identifier |
| `value` | TEXT | JSON-encoded or plain string value |
| `updated_at` | TEXT | Last change |

#### Expected Settings Keys

| Key | Example Value | Description |
|-----|---------------|-------------|
| `daily_goal_type` | `"pages"` | Mirror of active goal (optional cache) |
| `daily_goal_target` | `"10"` | Mirror of active goal target |
| `cloud_backup_enabled` | `"false"` | Cloudinary backup toggle |
| `theme` | `"system"` | `light`, `dark`, or `system` |
| `default_reading_timer_minutes` | `"0"` | 0 = no default timer |
| `last_blocker_note` | `"too tired"` | Last rescue journal entry |
| `last_blocker_note_at` | `"2026-06-13T..."` | Timestamp of last blocker note |
| `onboarding_complete` | `"true"` | First-run flag |

---

## Migrations

Use a simple versioned migration approach:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY NOT NULL,
  applied_at  TEXT NOT NULL
);
```

| Version | Description |
|---------|-------------|
| 1 | Initial schema (all tables above) |

Add new versions as schema evolves. Never edit applied migrations.

---

## TypeScript Types (Reference)

```typescript
export type BookStatus = 'not_started' | 'reading' | 'paused' | 'finished';

export interface Book {
  id: string;
  title: string;
  author: string | null;
  localUri: string;
  fileName: string;
  fileSize: number;
  cloudinaryPublicId: string | null;
  cloudinaryAssetId: string | null;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  isUploaded: boolean;
  isDownloaded: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Mood = 'calm' | 'tired' | 'motivated' | 'distracted' | 'stuck';

export interface ReadingSession {
  id: string;
  bookId: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  durationSeconds: number;
  focusLevel: number | null;
  mood: Mood | null;
  blockerReason: string | null;
  createdAt: string;
}

export type GoalType = 'pages' | 'minutes';

export interface DailyGoal {
  id: string;
  goalType: GoalType;
  targetValue: number;
  isActive: boolean;
  createdAt: string;
}
```

Map snake_case DB columns to camelCase in repository layer.

---

## Cascade Delete Behavior

When a book is deleted:
- All `reading_sessions` for that book → deleted
- All `bookmarks` for that book → deleted
- All `notes` for that book → deleted
- Local PDF file → deleted via `PdfFileService`
- Cloudinary asset → deleted via `CloudinaryService` (Phase 7, if uploaded)

`daily_goals` and `settings` are not affected.
