# Database Audit

**App:** Tin Pata v1.4.0 · **DB file:** `reading-habit.db` · **Schema version:** 4  
**Audited:** v1.5B (June 2026)

---

## Tables Summary

| Table | Purpose | Key fields | Risk / note |
|-------|---------|------------|-------------|
| `books` | PDF library metadata | `id` PK, `local_uri`, `status`, `category`, `priority`, `updated_at` | No soft delete. `category`/`priority` have defaults but no DB CHECK. Legacy Cloudinary columns unused. |
| `reading_sessions` | Reading log | `id` PK, `book_id` FK CASCADE | No `updated_at`. Orphans blocked when FK on. |
| `bookmarks` | Page markers | `id` PK, `book_id` FK CASCADE | Unique `(book_id, page_number)` — duplicate page import can fail. |
| `notes` | Page notes | `id` PK, `book_id` FK CASCADE, `updated_at` | Multiple notes per page allowed. |
| `daily_goals` | Daily targets | `id` PK, `goal_type`, `is_active` | No unique “one active” constraint; app picks latest active row. |
| `reflections` | Rescue journal | `id` PK, `book_id` FK SET NULL | `book_id` nullable; survives book delete. |
| `settings` | Key-value prefs | `key` PK, `value`, `updated_at` | Upsert via `ON CONFLICT`. All values are strings. |
| `schema_migrations` | Migration ledger | `version` PK, `applied_at` | Tracks applied versions 1–4. |

**Not in DB:** missing-PDF status (derived at runtime via `PdfAvailabilityService` + filesystem).

---

## Migration Summary

- [x] **Current schema version:** 4 (`schema_migrations`)
- [x] **Migrations:** `001_initial` → `002_goal_sessions_type` → `003_reflections` → `004_book_organization`
- [x] **FK enforcement:** `PRAGMA foreign_keys = ON` at open (`database.native.ts`)
- [x] **Backward compatibility:** v004 adds `category`/`priority` with `DEFAULT`; existing rows auto-filled
- [ ] **Risky migrations:** v002 rebuilds `daily_goals` (table swap) — safe copy, no data loss expected

---

## Data Integrity Rules

- **Book deletion:** `BookService.deleteBook` removes local PDF file, then `DELETE FROM books`. FK CASCADE removes sessions, bookmarks, notes; reflections get `book_id = NULL`.
- **Sessions:** Must reference existing book. Created with UUID; never updated after insert.
- **Notes / bookmarks:** Tied to `book_id`. CASCADE on book delete. Bookmarks: one per page per book (unique index).
- **Settings:** Portable keys whitelisted in backup; device-only keys stay local. `SettingsRepository.set` upserts by key.
- **Backup import:** Replace wipes all tables (not PDF files). Merge skips rows with existing IDs. Child rows skipped if parent book missing from import set.

---

## Risks Found

| Risk | Severity | Recommendation |
|------|----------|----------------|
| No soft delete / tombstones | Medium | Add `deleted_at` + sync flags in v2 before cloud sync |
| `category`/`priority` not CHECK-constrained | Low | App sanitizes on read; optional DB CHECK in v2 |
| Multiple active `daily_goals` possible via import | Low | Deactivate others on import or add partial unique index later |
| Bookmark unique index can abort import | Medium | Catch duplicate `(book_id, page)` on import; skip or merge |
| Replace / reset does not delete PDF files on disk | Medium | Document clearly; optional orphan cleanup in v2 |
| Legacy Cloudinary columns in `books` | Low | Ignore until v2 cloud PDF; strip on export (already done) |
| Missing `updated_at` on sessions, bookmarks, goals | Medium | Add for v2 conflict resolution |

**No critical schema bug found** — no migration changes in v1.5B.

---

## v2 Sync Readiness

| Need for v2 | Current status | Future change |
|---------------|----------------|---------------|
| Stable record IDs | ✅ UUID v4 (`generateId`) | Keep IDs across devices |
| `user_id` | ❌ Not present | Add on all user-owned tables |
| `device_id` | ❌ Not present | Track originating device |
| `updated_at` | ⚠️ Books, notes, settings only | Add to sessions, bookmarks, goals, reflections |
| `deleted_at` | ❌ Hard delete only | Soft delete before sync |
| `sync_status` | ❌ Not present | `pending` / `synced` / `conflict` |
| `last_synced_at` | ❌ Not present | Per-row or per-table watermark |
| Conflict rules | ❌ Not defined | Last-write-wins or field-level merge TBD |
| PDF path strategy | ⚠️ `{documentDirectory}/pdfs/{bookId}.pdf` | Cloud URI + local cache in v2 |
