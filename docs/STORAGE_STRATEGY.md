# Storage Strategy

How the app stores PDF files, metadata, and optional cloud backups.

---

## Three Storage Layers

| Layer | Stores | Required for MVP | Source of Truth |
|-------|--------|------------------|-----------------|
| **Local file storage** | PDF binary files | Yes | For reading |
| **SQLite** | Metadata, progress, sessions | Yes | For app state |
| **Cloudinary** | PDF backup copies | No (Phase 7) | For disaster recovery only |

---

## Principle: Local-First

```
Daily reading  →  Always from local file
App offline    →  Fully functional
Cloudinary     →  Backup / restore only when local file missing
```

The app must never depend on network access to open and read a PDF that has been imported.

---

## Local File Storage

### Purpose
- Store actual PDF files for fast offline reading
- Survive app restarts
- Remain the canonical source during normal use

### Location

```
{FileSystem.documentDirectory}/pdfs/{bookId}.pdf
```

Example with `expo-file-system`:
```
file:///data/user/0/com.readinghabit/files/pdfs/a1b2c3d4-....pdf
```

### Rules

| Rule | Detail |
|------|--------|
| Filename | Always `{bookId}.pdf` — bookId is UUID, not user title |
| Original name | Preserved in SQLite `books.file_name` for display only |
| On import | Copy (not move) from picker URI to app directory |
| On delete | Remove file when book is deleted from library |
| On read | PDF viewer loads `books.local_uri` directly |
| Integrity | Before opening reader, verify file exists via `PdfFileService.fileExists()` |

### Import Flow (File Layer)

```
1. User picks PDF via document picker
2. Generate bookId (UUID)
3. Copy file: pickerUri → documentDirectory/pdfs/{bookId}.pdf
4. Store local_uri in SQLite
5. Set is_downloaded = 1
```

### Storage Module (`src/storage/pdfStorage.ts`)

Responsibilities:
- Ensure `pdfs/` directory exists on first use
- Copy imported file to app storage
- Return file URI for SQLite
- Check existence before reader opens
- Delete file on book removal
- Return file size after copy

### What NOT to Store in Files

- Session data → SQLite
- Bookmarks → SQLite
- Notes → SQLite
- Thumbnails (future) → optional `pdfs/thumbs/{bookId}.jpg` — not MVP

---

## SQLite Database

### Purpose
- All structured metadata and reading history
- Fast queries for stats, streaks, goals
- Relational integrity (sessions → books)

### What SQLite Stores

| Data | Table |
|------|-------|
| Book title, author, status | `books` |
| Local file URI (path string only) | `books.local_uri` |
| Cloudinary IDs (not URLs) | `books.cloudinary_public_id` |
| Current page, total pages | `books` |
| Reading sessions | `reading_sessions` |
| Bookmarks | `bookmarks` |
| Notes | `notes` |
| Daily goals | `daily_goals` |
| App settings | `settings` |

### What SQLite Does NOT Store

| Data | Why |
|------|-----|
| PDF binary content | Files are large; bloats DB; slow queries |
| Base64-encoded PDFs | Same problem; use file storage |
| Permanent Cloudinary URLs | URLs expire; store `public_id` only |
| Cloudinary API secrets | Never in mobile app |

### URI vs Path

Store the full `file://` URI in `local_uri` as returned by `expo-file-system` after copy. The PDF viewer and file-exists checks use this URI directly.

---

## Cloudinary (Optional — Phase 7)

### Purpose
- Optional backup if local file is lost (app reinstall, device wipe)
- **Not** the primary reading source
- **Not** required for MVP

### What Gets Stored Where

| Location | Cloudinary data |
|----------|-----------------|
| SQLite `books.cloudinary_public_id` | Public ID string (e.g. `reading-habit/abc123`) |
| SQLite `books.cloudinary_asset_id` | Asset ID from upload response |
| SQLite `books.is_uploaded` | 1 after successful backup |
| Mobile app | **Never** API secret or permanent URL |

### Reading Priority

```
1. Local file exists?     → Read local
2. Local missing + cloudinary_public_id?  → Restore from Cloudinary → save local → read local
3. Neither?               → Show error; user must re-import
```

### Sync Model (Not Live Sync)

This is **backup/restore**, not multi-device live sync:
- Upload happens once after import (if backup enabled)
- Download happens on-demand when local file is missing
- No watch/real-time sync between devices in v1

---

## Storage Comparison

| Concern | Local Files | SQLite | Cloudinary |
|---------|-------------|--------|------------|
| PDF content | ✅ | ❌ | ✅ (backup) |
| Book title | ❌ | ✅ | ❌ |
| Current page | ❌ | ✅ | ❌ |
| Sessions | ❌ | ✅ | ❌ |
| Works offline | ✅ | ✅ | ❌ |
| Survives reinstall | ❌ | ❌ | ✅ |
| Fast read | ✅ | N/A | ❌ (network) |

---

## Disk Space Considerations

- PDFs can be large (10–50 MB+ each)
- No automatic cleanup in MVP
- User deletes books manually from library
- Future: show total storage used in Settings

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Import copy fails | Show error; no DB row created |
| Local file missing on open | MVP: "File not found. Re-import PDF." Phase 7: offer Cloudinary restore |
| SQLite write fails | Show error; do not update UI optimistically |
| Cloudinary upload fails | Book remains usable locally; `is_uploaded` stays 0; retry later |

---

## Implementation Checklist

- [ ] Create `pdfs/` directory on app init
- [ ] Copy on import (never reference picker URI long-term — it may be temporary)
- [ ] Store `local_uri` in SQLite immediately after copy
- [ ] Verify file exists before opening reader
- [ ] Delete file when book deleted
- [ ] Never INSERT pdf bytes into SQLite
- [ ] Store Cloudinary `public_id` only, never secret keys

See [Cloudinary Backup](CLOUDINARY_BACKUP.md) for secure upload/download flows.
