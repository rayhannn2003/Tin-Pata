# v2 Local Sync Fields — Test Checklist

Manual QA for v2.0B (local schema + device identity). **Cloud sync must not occur.**

---

## Device identity

- [ ] Fresh install creates `device_id` (Settings → Account shows shortened id)
- [ ] App restart keeps the same device id
- [ ] Full “Reset all data” gets a new device id (optional — verify if reset clears settings)

---

## Migration

- [ ] Existing DB (pre-v2.0B) opens without crash
- [ ] Existing books/sessions/notes still visible after upgrade
- [ ] No required login after migration

---

## Local writes

- [ ] Import PDF creates book with sync fields (inspect via backup export if needed)
- [ ] Create note/bookmark/session adds metadata (`device_id`, `sync_status: local`)
- [ ] Update book progress updates `updated_at` / `current_page_updated_at`
- [ ] Finish reading session saves with `updated_at`

---

## Local-only & auth

- [ ] All tabs work without login
- [ ] Sign in does not upload data
- [ ] Sign out does not delete local data
- [ ] Settings shows “Cloud sync: not enabled yet”

---

## Backup

- [ ] Export backup succeeds (JSON valid)
- [ ] Export does not include `tin_pata_device_id`
- [ ] Import old backup file (pre-sync fields) succeeds
- [ ] Import sets restored rows to current device id + `sync_status: local`
- [ ] PDF relink still works after import

---

## Automated checks

- [ ] `npm run typecheck` passes
- [ ] `npx expo-doctor` passes (or only known pre-existing warnings)

---

## Regression

- [ ] PDF reader unchanged (open, bookmark, note, session)
- [ ] Goals, stats, rescue flow work
- [ ] Notifications settings survive backup round-trip
