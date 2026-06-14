# Backup and Restore

Tin Pata **v1.4B** — local JSON backup for reading data. No cloud sync.

---

## What is included

Exported backup files (`.json`) contain:

| Field | Description |
|-------|-------------|
| `appName` | `"Tin Pata"` |
| `backupVersion` | Backup schema version (currently **2**) |
| `appVersion` | App version at export time (e.g. `1.3.0`) |
| `exportedAt` | ISO timestamp |
| `platform` | `android`, `ios`, or `web` |
| `books` | Metadata, progress, category, priority (not PDF bytes) |
| `reading_sessions` | Sessions with mood/focus/blocker fields when present |
| `bookmarks` | Per-page bookmarks |
| `notes` | Per-page notes |
| `daily_goals` | Goal definitions |
| `reflections` | Reader's block reflections |
| `settings` | Portable app/reader/notification preferences |
| `pdf_files_included` | Always `false` |

Legacy snake_case fields (`app_name`, `export_version`, etc.) are also written for compatibility with v1 backups.

Portable settings include language, theme, onboarding flag, reader comfort prefs (fit, scroll, focus, brightness), and notification reminder times — not notification IDs or permission state.

---

## What is NOT included

- **PDF file bytes** — copy PDF files separately to the new device
- Cloudinary IDs or upload state
- Scheduled notification IDs
- Library UI filter/sort state (session-only)
- Any server/cloud account data (none exists)

---

## Export

1. Open **Settings → Data backup**
2. Tap **Export backup (JSON)**
3. Save the file from the Android share sheet to Files, Drive, or another safe location

Filename pattern: `tin-pata-backup-YYYY-MM-DD-HH-mm.json`

---

## Import flow

1. Tap **Import backup (JSON)** and pick a `.json` file
2. Tin Pata validates the file (JSON structure, app name, supported backup version)
3. **Backup preview** shows counts, date, app version, and warnings
4. Choose import mode:
   - **Merge with current data** — adds new records; skips duplicates by ID
   - **Replace current data** — deletes all local reading data first, then restores (destructive)
5. Confirm restore
6. **Import result** summary shows imported/skipped counts and missing PDF warnings

Invalid files show a user-friendly error — no stack traces in the UI.

---

## Merge vs replace

| Mode | Behavior |
|------|----------|
| **Merge** | Keeps existing books, sessions, notes, etc. Adds backup records with new IDs. Skips records whose ID already exists. Existing portable settings are kept; only missing setting keys are added from the backup. |
| **Replace** | Wipes all books, sessions, notes, bookmarks, goals, reflections, and settings on device, then inserts backup data. **Cannot be undone.** |

Replace mode shows a strong warning before confirmation.

---

## Legacy backup compatibility

Backups from v1.0–v1.3 may:

- Use `export_version: 1` instead of `backupVersion: 2`
- Omit `category`, `priority` on books → default to `general` / `normal`
- Omit reader brightness, fit mode, scroll mode, focus mode → defaults apply on import
- Omit mood/focus/blocker on older sessions → stored as `null`
- Omit `appName` → accepted with a legacy warning

Unsupported backup versions are rejected before any data changes.

---

## PDF restore and relink (v1.4B)

JSON backup **does not include PDF files**. Book records store a `localUri` path from the export device, which usually does not exist after restore on another phone.

### Missing PDF detection

Tin Pata checks PDF availability **dynamically** at runtime (no extra database column):

- `localUri` is empty, or
- The canonical app file `pdfs/{bookId}.pdf` does not exist, and
- The stored `localUri` path is not readable

`PdfAvailabilityService` performs this check. Books with missing PDFs show a calm **“PDF missing”** badge in the library.

### Relink flow

When a PDF is missing:

1. Open **Book Detail** (or use **Relink PDF** from the library)
2. Tap **Relink PDF** and choose a PDF file
3. The file is copied into app storage (`pdfs/{bookId}.pdf`)
4. The book’s `localUri` and `fileName` are updated

**Preserved after relink:**

- `current_page`, `status`, `category`, `priority`
- All reading sessions, notes, and bookmarks
- Reading stats and analytics

**Page count differences:**

- If the new PDF has fewer pages than the saved `current_page`, the page is clamped safely
- After the reader opens, `total_pages` may update from the new file
- A warning is shown if the saved page was adjusted

The reader **does not open** until a valid PDF is relinked — `react-native-pdf` never receives an invalid URI.

### Import result

After backup import, the result summary shows:

- How many books were restored
- How many books need PDF relink
- That notes and bookmarks were preserved

Example: *“5 books restored. 3 books need PDF relink.”*

---

## PDF restore (manual copy)

PDFs are **not** in the JSON file. After import you can either:

1. **Relink PDF** per book (recommended), or
2. Copy PDF files manually to matching paths (advanced)

Books with missing files show `isDownloaded: false` until relinked.

Future optional PDF cloud restore is documented separately in [CLOUDINARY_BACKUP.md](./CLOUDINARY_BACKUP.md) — not part of v1.4.

---

## Safety warnings

- Always export before **Replace current data**
- Test merge on a copy first if unsure
- Backups from a **newer app version** may contain fields this build ignores
- Backups from an **older app version** use safe defaults for missing fields
- Corrupt individual records are skipped; valid records still import (`import_partial` warning)

---

## Related docs

- [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) — app-wide limits
- [VERSION_HISTORY.md](./VERSION_HISTORY.md) — release notes
