# v2 PDF Cloud Backup — Test Checklist

Manual QA for v2.0D. Requires `V2_SUPABASE_STORAGE_SETUP.sql` applied.

---

## Setup

- [ ] Storage bucket `user-pdfs` exists (private)
- [ ] Storage policies applied
- [ ] Signed-in user with linked local data (optional for metadata sync test)

---

## Logged out

- [ ] Book Detail shows sign-in prompt for PDF cloud section

---

## Upload

- [ ] Local PDF under 50 MB uploads after confirmation
- [ ] Status shows “Backed up to cloud”
- [ ] Library badge “Cloud backed up” (when logged in)
- [ ] PDF over 50 MB shows local-only message; upload blocked
- [ ] Upload failure leaves local PDF and metadata intact

---

## Metadata sync

- [ ] After upload, book metadata syncs on **Sync now** (cloud flags in Postgres)
- [ ] PDF bytes are not sent via metadata queue

---

## Delete cloud

- [ ] Delete cloud with local PDF present → confirmation mentions local kept
- [ ] Local PDF still opens after cloud delete
- [ ] Progress, notes, bookmarks unchanged
- [ ] Delete cloud without local PDF → stronger warning shown

---

## Download

- [ ] Book with cloud copy but missing local → **Download PDF** works
- [ ] Downloaded PDF opens in reader
- [ ] Progress/notes/bookmarks preserved

---

## Relink & regression

- [ ] Relink PDF still works
- [ ] Metadata sync still works
- [ ] Reader behavior unchanged

---

## Automated

- [ ] `npm run typecheck` passes
- [ ] `npx expo-doctor` passes
