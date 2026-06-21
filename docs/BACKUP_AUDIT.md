# Backup Audit

**Format:** JSON · **Export version:** 2 · **Supported import:** 1, 2  
**Code:** `src/types/backup.ts`, `src/services/BackupService.ts`  
**Audited:** v1.5B (June 2026)

---

## What Backup Includes

- [x] Metadata: `appName`, `backupVersion`, `appVersion`, `exportedAt`, `platform`
- [x] `books` — title, author, progress, status, category, priority, file metadata (not PDF bytes)
- [x] `reading_sessions`, `bookmarks`, `notes`, `daily_goals`, `reflections`
- [x] Portable `settings` only (language, theme, onboarding, reader prefs, notification times, `last_backup_at`)
- [x] Legacy aliases written on export (`app_name`, `export_version`, …) for older readers
- [x] `pdf_files_included: false` always

---

## What Backup Does Not Include

- **PDF files** — copy separately or use Relink PDF after restore
- **Cloud sync / account data** — no server, no auth
- **Non-portable settings** — device/session keys excluded from export whitelist
- **Cloudinary IDs** — stripped on export; cleared on import

---

## Import Flow

```
Select JSON → parse → validateBackupJson → preview (counts + warnings)
  → user picks merge | replace → confirm (replace = double confirm)
  → importBackup → ImportResult summary → relink missing PDFs if needed
```

- Invalid JSON → `invalid_json`
- Bad structure / unknown app / unsupported version → hard error
- Sanitize drops malformed rows → `import_partial` warning

---

## Restore Modes

| Mode | Behavior | Risk | Protection |
|------|----------|------|------------|
| **Merge** | Insert only new IDs; skip existing books/settings | Stale data if same ID, different content | Skips duplicates; keeps local PDFs |
| **Replace** | Delete all DB rows, insert backup | **Wipes local data**; PDF files stay on disk | Two-step UI confirm; transactional restore |

Both modes: skip sessions/notes/bookmarks whose `book_id` is missing from imported books.

---

## Legacy Compatibility

- Missing `backupVersion` → treated as v1 with `legacy_backup` warning
- Snake_case fields accepted (`export_version`, `local_uri`, `book_id`, …)
- Missing `category`/`priority` → defaults via `parseBookCategory` / `parseBookPriority`
- Unknown JSON fields ignored during sanitize
- `pdf_files_included: true` → rejected (`pdf_included_unsupported`)
- Newer backup version than app supports → `unsupported_version` error
- App version mismatch → warning only (`newer_app_version` / `older_app_version`)

---

## Risks Found

| Risk | Severity | Recommendation |
|------|----------|----------------|
| PDFs not in backup | Expected | User must relink; UI warns in preview |
| Replace leaves orphan PDF files | Medium | Document; optional cleanup tool later |
| Merge never updates existing books | Medium | Document; v2 may need upsert merge |
| Bookmark unique `(book_id, page)` can fail import | Medium | Pre-check duplicates before insert |
| `localUri` from other device usually invalid | Expected | `isDownloaded` set from filesystem check |
| Import can create multiple active goals | Low | Normalize active goal after import in v2 |
| Merge keeps local settings when key exists | Low | By design — local prefs win |

**No critical backup bug found** — no format change in v1.5B.

---

## v2 Cloud Sync Impact

- Backup JSON is a useful **first migration envelope** (stable IDs, full reading graph).
- **IDs must stay stable** — merge/replace must not reassign UUIDs on existing rows.
- v2 needs **soft delete + sync metadata** before treating backup as sync snapshot.
- PDF strategy: metadata in DB/sync; bytes in object storage + local cache.
- Import must remain compatible so users can restore locally before enabling cloud.
