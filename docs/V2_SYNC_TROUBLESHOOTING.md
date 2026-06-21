# V2 Sync Troubleshooting

## Sync failed

1. Check internet connection.
2. Sign out and sign in again if session expired.
3. Settings → **Retry failed sync**.
4. Settings → **Run sync check** → **Sync repair** for stuck queue items.
5. Tap **Sync now** again.

## Pending changes stuck

- Confirm local data is linked to the signed-in account.
- Run sync check; repair may reset stuck `processing` queue rows.
- Retry failed sync if failed count > 0.
- Re-enqueue happens during sync repair when invalid sync status or failed queue exists.

## Duplicate records

- Should not occur with stable IDs and upsert-by-id. If seen, export backup, note entity ids, and report.
- Run sync check — duplicate IDs are reported as errors.

## Missing PDFs (local)

- **Cloud available:** Open book → download cloud PDF.
- **Cloud unavailable:** Relink local PDF from book detail.
- Local reading metadata (notes, progress) remains even without PDF file.

## Cloud PDF deleted

- Local PDF on device that had the file remains.
- Other devices lose cloud download until manual backup again.
- Reading data is not deleted.

## Login / session issue

- Sign out and sign in.
- Ensure Supabase env vars are set in `.env`.
- Permission errors often mean data is not linked — use **Prepare local data for cloud sync**.

## Storage limit issue

- Supabase free tier storage may block PDF upload.
- Metadata sync still works; PDF backup is optional and manual.

## Invalid backup after sync

- Export a fresh backup after metadata sync completes.
- Import restores local SQLite data; cloud link state is separate — re-link if needed on new install.

## Sync check warnings (non-critical)

- **Orphan notes/bookmarks:** Book missing locally; data kept for safety.
- **Cloud flag mismatch:** Run sync repair to refresh PDF cloud flags.
- **Local PDF missing + cloud available:** Download from book detail.

Nothing in sync repair deletes user reading data.
