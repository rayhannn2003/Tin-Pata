# V2 Cloud Sync — UI Testing Workflow

Manual UI test path for Tin Pata **2.0.0-alpha.5** cloud sync (metadata + manual PDF backup).

**Prerequisites:** `.env` configured, Supabase SQL applied, email confirmation **OFF** in Supabase dashboard.

---

## Phase 1 — Local app (no account)

| # | UI steps | Expected |
|---|----------|----------|
| 1 | Cold start app | Opens **Home** (no forced sign-in) |
| 2 | Library → Import PDF | Book in library |
| 3 | Open book → read → add note | Data saved locally |
| 4 | Settings → Account | Shows **Sign in** + **Sign up** (optional for cloud) |

---

## Phase 2 — Sign up / Sign in (Settings)

| # | UI steps | Expected |
|---|----------|----------|
| 5 | Settings → **Sign up** | Sign-up screen |
| 6 | Enter email + password → **Sign up** | Returns to Settings; signed in (no email confirm step) |
| 7 | Supabase → `profiles` table | New row for user (trigger) |
| 8 | Settings → Account | Shows email; **Sign out** available |
| 9 | Sign out → **Sign in** again | Works without confirmation email |

---

## Phase 3 — Link local data

| # | UI steps | Expected |
|---|----------|----------|
| 10 | Settings → **Cloud sync** section | Status: local not linked |
| 11 | **Prepare local data for cloud sync** | Confirm → linked |
| 12 | Status | **Ready to sync**; pending changes count shown |
| 13 | Copy visible | “PDF files sync only if backed up manually.” |
| 14 | Copy visible | “Local reading still works offline.” |

---

## Phase 4 — Metadata sync

| # | UI steps | Expected |
|---|----------|----------|
| 15 | **Sync now** | Success message; last sync time updates |
| 16 | Edit a note → **Sync now** | Pending count drops; change in Supabase |
| 17 | Turn on airplane mode → **Sync now** | Friendly error; app still usable |
| 18 | Turn off airplane mode → **Retry failed sync** | Failed items retry |
| 19 | **Sync now** twice | No duplicate books/notes/sessions |

---

## Phase 5 — Sync health

| # | UI steps | Expected |
|---|----------|----------|
| 20 | **Run sync check** (clean state) | “No sync issues found” |
| 21 | **Clear synced queue** (if offered) | Confirm → old queue rows cleared |
| 22 | If warnings appear | Summary shown; **Sync repair** offered |

---

## Phase 6 — PDF cloud (manual)

| # | UI steps | Expected |
|---|----------|----------|
| 23 | Book detail → PDF cloud card | Backup option (signed in + linked) |
| 24 | Backup PDF **under 50 MB** | Success; cloud available |
| 25 | Try PDF **over 50 MB** | Rejected with message |
| 26 | **Delete cloud PDF** | Local PDF + notes/sessions remain |
| 27 | Second device: sync → download | PDF opens locally |

---

## Phase 7 — Second device

| # | UI steps | Expected |
|---|----------|----------|
| 28 | Device B: install → Settings → sign in | Same account |
| 29 | Link local data → **Sync now** | Books/metadata appear |
| 30 | Book with cloud PDF | Download works |
| 31 | Book without cloud PDF | Relink needed message |

---

## Phase 8 — Conflicts (two devices)

| # | UI steps | Expected |
|---|----------|----------|
| 32 | Edit same note on A and B → sync both | Latest edit wins |
| 33 | Read backward on B → sync both | Latest page activity wins |
| 34 | Delete cloud PDF on A → sync B | B shows cloud unavailable (unless local copy) |

---

## Phase 9 — Backup / sign out

| # | UI steps | Expected |
|---|----------|----------|
| 35 | Settings → export backup | Valid JSON file |
| 36 | Sign out | Stays in app; can keep reading locally |
| 37 | Sign in again → **Sync now** | Metadata restored from cloud |

---

## Quick smoke (~20 min)

Home → import PDF → Settings sign up → link local data → Sync now → PDF backup → Run sync check → sign out → sign in → Sync now

---

## Supabase checklist

- [ ] Email confirmation **disabled**
- [ ] `handle_new_user` trigger active
- [ ] Metadata schema + storage bucket SQL applied
- [ ] RLS policies active

---

## Related docs

- `V2_SYNC_QA_CHECKLIST.md`
- `V2_SYNC_TROUBLESHOOTING.md`
- `V2_UI_TESTING_WORKFLOW.md` (full v2 UI)
- `V2_PDF_CLOUD_BACKUP_TEST_CHECKLIST.md`
