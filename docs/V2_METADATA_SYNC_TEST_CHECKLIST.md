# v2 Metadata Sync — Test Checklist

Manual QA for v2.0C. Requires Supabase metadata schema applied.

---

## Prerequisites

- [ ] `V2_SUPABASE_SETUP.sql` applied
- [ ] `V2_SUPABASE_METADATA_SCHEMA.sql` applied
- [ ] `.env` configured; dev client rebuilt if needed

---

## Local-only

- [ ] App works logged out (import, read, notes, backup)
- [ ] Login does **not** upload data automatically
- [ ] No sync queue items before link action

---

## Link flow

- [ ] Signed-in user sees “Local data is not linked to cloud yet”
- [ ] **Prepare local data** shows confirmation warning
- [ ] After confirm, pending changes count > 0
- [ ] Local rows have `user_id` set (optional: inspect backup export)

---

## Manual sync

- [ ] **Sync now** pushes notes/bookmarks/sessions/books metadata
- [ ] Supabase tables show rows for user (dashboard)
- [ ] **Sync completed** alert on success
- [ ] Last synced time updates in Settings
- [ ] Restart app — sync state persists

---

## Incremental sync

- [ ] Create note after sync → pending count increases
- [ ] **Sync now** again → note appears in Supabase
- [ ] Finish reading session → syncs on next **Sync now**
- [ ] Toggle bookmark → syncs on next **Sync now**

---

## Errors

- [ ] Airplane mode / no network → friendly sync failed message
- [ ] App does not crash on sync failure

---

## PDF / scope

- [ ] PDF files are **not** uploaded
- [ ] UI states “PDF files are not synced yet”
- [ ] PDF reader behavior unchanged

---

## Backup

- [ ] Export backup works after linking
- [ ] Import old backup resets sync fields to local
- [ ] Re-link required after import if cloud sync desired

---

## Automated

- [ ] `npm run typecheck` passes
- [ ] `npx expo-doctor` passes
