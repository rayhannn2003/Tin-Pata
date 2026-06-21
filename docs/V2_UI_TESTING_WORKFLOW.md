# V2 UI Testing Workflow

End-to-end manual testing from the app UI for Tin Pata **2.0.0-alpha.5**.

Use two Android devices (or one device + emulator) for sync scenarios.

---

## 0. Before you start

- [ ] `.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Supabase SQL applied: `V2_SUPABASE_SETUP.sql`, `V2_SUPABASE_METADATA_SCHEMA.sql`, `V2_SUPABASE_STORAGE_SETUP.sql`
- [ ] Profile trigger applied (`handle_new_user` in setup SQL)
- [ ] App built with dev client if using native auth storage
- [ ] Test PDFs ready: one **under 50 MB**, one **over 50 MB**

---

## 1. First launch — auth gate

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Cold start app (clear from recents) | Splash briefly, then **Sign in** screen (not Home) |
| 1.2 | Tap “continue without account” text | Goes to **Home** tab |
| 1.3 | Kill app, reopen | Goes directly to **Home** (local-only remembered) |
| 1.4 | Settings → Account → **Sign out** path: tap Sign in → sign in | After sign-in, lands on **Home** |
| 1.5 | Sign out from Settings or Account | Returns to **Sign in** screen |

**Settings should NOT show separate Sign up button** — only Sign in link when logged out.

---

## 2. Sign up (one flow only)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | From Sign in → tap “Don't have an account? Sign up” | Sign up screen opens |
| 2.2 | Enter new email + password (6+ chars) → **Sign up** | Account created; profile auto-created in Supabase |
| 2.3 | If email confirmation enabled | “Check your email” message; confirm then sign in |
| 2.4 | After successful sign up | Redirect to **Home** |
| 2.5 | Supabase dashboard → `profiles` table | Row exists for new user (from trigger) |

There is **one** sign-up path — no duplicate “Create account” button in Settings.

---

## 3. Sign in (returning user)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Kill app while signed in | Reopen → **Home** directly (token restored) |
| 3.2 | Wrong password | Friendly error, stays on sign-in |
| 3.3 | Airplane mode + sign in | Network error message, no crash |

---

## 4. Onboarding & local reading

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | First Home visit (local-only or signed in) | Onboarding modal may appear |
| 4.2 | Library → **Import PDF** | Book appears in library |
| 4.3 | Open book → read a few pages | `current_page` updates |
| 4.4 | Add note + bookmark | Saved locally |
| 4.5 | Home → Continue reading | Shows last book/page |

---

## 5. Link local data & metadata sync

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Settings → Cloud sync (signed in) | Status: local not linked |
| 5.2 | **Prepare local data for cloud sync** | Confirm dialog → linked |
| 5.3 | Status shows **Ready to sync**, pending count > 0 | — |
| 5.4 | **Sync now** | Metadata synced message; last sync updates |
| 5.5 | Edit a note → **Sync now** | Change appears in Supabase metadata table |
| 5.6 | Airplane mode → **Sync now** | Friendly error; local data still readable |
| 5.7 | **Retry failed sync** (if failed count shown) | Retries queue items |

---

## 6. Sync health tools

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | **Run sync check** (clean state) | “No sync issues found” |
| 6.2 | **Clear synced queue** | Confirm → completed items removed |
| 6.3 | If warnings shown | Summary + optional **Sync repair** |

---

## 7. PDF cloud backup (manual)

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Book detail → cloud card (signed in, linked) | Backup option visible |
| 7.2 | Backup PDF **under 50 MB** | Success; cloud available flag set |
| 7.3 | Try PDF **over 50 MB** | Rejected with clear message |
| 7.4 | **Delete cloud PDF** | Local PDF + notes/sessions remain |
| 7.5 | Settings copy | “PDF files sync only if backed up manually.” |

---

## 8. Second device restore

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Device B: install app → sign in same account | Sign in screen → Home after login |
| 8.2 | Settings → link local data → **Sync now** | Books/metadata appear |
| 8.3 | Book with cloud PDF | Download option works |
| 8.4 | Book without cloud PDF | Relink needed message |
| 8.5 | Download cloud PDF | Opens in reader locally |

---

## 9. Conflict spot checks

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Device A & B: edit same note, sync both | Latest edit wins |
| 9.2 | Device B: read to earlier page, sync both | Latest page activity wins (not highest page) |
| 9.3 | Sync twice on same device | No duplicate books/sessions/notes |

---

## 10. Account & settings

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | Settings → Account → open Account | Email shown |
| 10.2 | Change display name → Save | Saved to Supabase profile |
| 10.3 | Sign out | Back to Sign in screen |
| 10.4 | Language toggle (EN/BN) | Auth + sync strings translate |

---

## 11. Backup export / import

| Step | Action | Expected |
|------|--------|----------|
| 11.1 | Settings → export backup (after sync) | `.json` backup file created |
| 11.2 | Import same or new backup | Local data restored |
| 11.3 | Sync still works after import | Link + sync if same account |

---

## 12. Automated checks (developer)

```bash
npm run typecheck
npx expo-doctor
```

Both should pass before release candidate.

---

## Quick smoke path (~15 min)

1. First launch → Sign in screen  
2. Sign up → Home  
3. Import PDF → read → note  
4. Link local data → Sync now  
5. PDF backup (<50 MB)  
6. Run sync check  
7. Sign out → Sign in → Home directly  
8. Export backup  

---

## Related docs

- `V2_SYNC_QA_CHECKLIST.md` — detailed sync QA  
- `V2_SYNC_TROUBLESHOOTING.md` — fix common issues  
- `V2_AUTH_TEST_CHECKLIST.md` — auth-specific tests  
- `V2_RELEASE_READINESS.md` — release gate  
