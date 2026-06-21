# v2 DevOps Readiness Checklist

Gate list before full cloud sync. **v2.0A:** auth foundation only.

---

## Supabase & secrets

- [x] **Anon key in app only** — v2.0A (`EXPO_PUBLIC_*`)
- [ ] **Separate dev/prod Supabase projects**
- [ ] **RLS on all user tables** — `profiles` done; sync tables later
- [ ] **Edge Functions** for secret/LLM calls
- [ ] **Never service role in mobile app**
- [ ] **`.env` gitignored** — use `.env.example`

---

## Release engineering

- [ ] **Backup before sync migration** — user prompt mandatory
- [ ] **DB migration plan** — SQLite + Supabase coordination
- [ ] **Build profile env vars** in `eas.json` per environment
- [ ] **Release channel** — EAS Update vs APK-only decision
- [ ] **Rollback plan** — disable sync; patch APK; JSON backup restore

---

## Observability & compliance

- [ ] **Crash/error logging** (Sentry etc.)
- [ ] **Privacy policy** before public account release
- [ ] **Data export/deletion** — account delete + export flow

---

## v2.0A complete

- [x] Optional Supabase Auth
- [x] Profiles SQL + RLS draft
- [x] Local-only mode unchanged

---

## References

- [ENVIRONMENT_AND_SECRETS.md](./ENVIRONMENT_AND_SECRETS.md)
- [V2_AUTH_FOUNDATION.md](./V2_AUTH_FOUNDATION.md)
- [RELEASE_PROCESS.md](./RELEASE_PROCESS.md)
