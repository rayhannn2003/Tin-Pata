# v2.0A — Auth Foundation

**Version:** 2.0.0-alpha.1 · **Scope:** Supabase Auth + profiles only

---

## What was added

| Item | Detail |
|------|--------|
| Supabase client | `src/lib/supabase.ts` — anon key only, AsyncStorage session |
| Auth service | Sign up, sign in, sign out, session restore |
| Profile service | Fetch / create / update display name |
| Auth UI | Sign in, sign up, account screens + Settings section |
| SQL draft | `docs/V2_SUPABASE_SETUP.sql` — `profiles` + RLS |

---

## What was NOT added

- Cloud sync of books, sessions, notes, bookmarks
- PDF upload
- Backup/restore changes
- Forced login
- Service role key or LLM keys in app

---

## Local-only still works

- App opens without internet
- No login required
- SQLite, PDFs, backup unchanged
- Auth buttons disabled with message if `.env` missing

Signing in **does not upload** local data. UI states this clearly.

---

## Security rules

| Rule | Status |
|------|--------|
| Anon key only in app | ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| Service role in app | ❌ Never |
| RLS on `profiles` | ✅ Required — run SQL draft |
| `.env` gitignored | ✅ |
| Real keys in repo | ❌ Never commit |

---

## Env setup

```bash
cp .env.example .env
# Fill EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
# Restart Metro: npx expo start -c
```

Run `docs/V2_SUPABASE_SETUP.sql` in Supabase SQL Editor before profile create.

---

## Next phase (v2.0B+)

- `user_id` on local SQLite rows
- `device_id`, `sync_status`, `updated_at`, `deleted_at`
- Metadata sync (not PDFs first)
- Conflict rules

See: [V2_DATA_READINESS_CHECKLIST.md](./V2_DATA_READINESS_CHECKLIST.md)
