# v2.0D — PDF Cloud Backup

Optional manual PDF backup to **Supabase Storage** private bucket `user-pdfs`. Separate from metadata sync queue.

---

## What it does

- **Upload** local PDF per book (manual, confirmed)
- **Download** cloud PDF when local file missing
- **Delete cloud copy** without deleting local PDF or reading data
- Updates book metadata + enqueues metadata sync (not the PDF bytes)

---

## Limits

- **Max size:** 50 MB (`MAX_CLOUD_PDF_SIZE_BYTES`)
- Larger PDFs stay **local-only** with UI message
- Unknown size → upload refused

---

## Storage layout

| Item | Value |
|------|--------|
| Bucket | `user-pdfs` (private) |
| Path | `{user_id}/books/{book_id}/original.pdf` |
| MIME | `application/pdf` |

Setup: [V2_SUPABASE_STORAGE_SETUP.sql](./V2_SUPABASE_STORAGE_SETUP.sql)

---

## Book metadata fields (SQLite + Postgres)

| Field | Purpose |
|-------|---------|
| `cloud_storage_path` | Storage object path |
| `pdf_file_name` | Backed-up filename |
| `pdf_file_size` | Bytes at upload |
| `pdf_sha256` | Optional integrity hash |
| `pdf_uploaded_at` | Upload timestamp |
| `pdf_cloud_available` | Cloud copy exists |
| `pdf_cloud_deleted_at` | Last cloud delete time |

Local PDF presence is derived via `PdfAvailabilityService` (not a DB column).

---

## Manual upload only

No auto-upload on import, relink, or login. User taps **Back up PDF to cloud** on Book Detail.

---

## Delete cloud copy

- Removes Storage object only
- Sets `pdf_cloud_available = false`, clears `cloud_storage_path`
- Preserves `pdf_file_name` / size / hash history; sets `pdf_cloud_deleted_at`
- Local PDF, progress, notes, bookmarks, sessions unchanged
- Strong warning if local copy missing

---

## Download

- Fetches from Storage → writes `{documentDirectory}/pdfs/{bookId}.pdf`
- Updates `local_uri`, `is_downloaded`
- Does not reset reading progress

---

## vs metadata sync

| | Metadata sync | PDF cloud |
|--|---------------|-----------|
| Transport | Postgres rows | Storage bucket |
| Trigger | Sync now (queue) | Per-book buttons |
| PDF bytes | Never | On manual upload/download |

---

## Security

- Anon key + RLS/Storage policies only
- **No service role key** in the app
- Users can only access paths under their `auth.uid()`

---

## Related

- [V2_METADATA_SYNC.md](./V2_METADATA_SYNC.md)
- [V2_STORAGE_STRATEGY.md](./V2_STORAGE_STRATEGY.md)
- [V2_PDF_CLOUD_BACKUP_TEST_CHECKLIST.md](./V2_PDF_CLOUD_BACKUP_TEST_CHECKLIST.md)
