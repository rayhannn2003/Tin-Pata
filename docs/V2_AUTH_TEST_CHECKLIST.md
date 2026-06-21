# v2 Auth Test Checklist

Manual QA for v2.0A auth foundation.

---

## Local-only (no Supabase env)

- [ ] App opens without internet
- [ ] All tabs work without login
- [ ] Import PDF, read, sessions, notes, bookmarks work
- [ ] Backup export/import works
- [ ] Settings shows account section with “not configured” note
- [ ] Sign in/up buttons disabled or show friendly message

---

## With Supabase configured

- [ ] `profiles` table + RLS applied (`V2_SUPABASE_SETUP.sql`)
- [ ] Sign up creates auth user
- [ ] Sign in works with valid credentials
- [ ] Invalid credentials show friendly error
- [ ] Session persists after app restart
- [ ] Sign out clears session in Settings
- [ ] Account screen shows email + “sync not enabled”
- [ ] Display name save works (optional)

---

## Data safety

- [ ] Local SQLite data unchanged after sign in
- [ ] Local data unchanged after sign out
- [ ] No books/sessions/notes uploaded to Supabase
- [ ] No PDF files uploaded

---

## Automated checks

- [ ] `npm run typecheck` passes
- [ ] `npx expo-doctor` passes

---

## Email confirmation (if enabled in Supabase)

- [ ] Sign up shows “check your email” when no session returned
- [ ] User can sign in after confirming email
