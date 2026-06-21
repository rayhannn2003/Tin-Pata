# v2 DevOps Readiness Checklist

Gate list before cloud sync and public release. **Not implemented in v1.5D.**

---

## Infrastructure

- [ ] **Supabase env plan** — `EXPO_PUBLIC_SUPABASE_URL`, anon key; secrets on Edge Functions only
- [ ] **Separate dev/prod Supabase projects** — no shared production data in dev
- [ ] **RLS on all tables** before any real user accounts
- [ ] **Edge Functions** for LLM, webhooks, privileged operations
- [ ] **Migration plan** — local SQLite → cloud rows; backup before first sync

---

## Release engineering

- [ ] **Version bump process** — keep `package.json`, `app.json`, EAS remote version aligned
- [ ] **Release channel decision** — EAS Update vs store tracks vs manual APK only
- [ ] **Build profiles** — dev / preview / production env vars per profile in `eas.json`
- [ ] **Database migrations** — server-side + client schema version coordination
- [ ] **Rollback plan** — disable sync flag; ship patch APK; restore from JSON backup

---

## Observability & compliance

- [ ] **Crash/error logging decision** — Sentry or similar (not in v1)
- [ ] **Privacy policy** — required before public / Play Store release
- [ ] **Data export/deletion** — GDPR-style user data export + account delete flow
- [ ] **Backup before sync migration** — mandatory user prompt on first v2 enable

---

## Security review (before v2 ship)

- [ ] No service-role keys in repo or APK
- [ ] No LLM keys in client
- [ ] `.env.example` documented; `.env` gitignored
- [ ] Pen-test anon key + RLS policies

---

## References

- [ENVIRONMENT_AND_SECRETS.md](./ENVIRONMENT_AND_SECRETS.md)
- [V2_DATA_READINESS_CHECKLIST.md](./V2_DATA_READINESS_CHECKLIST.md)
- [RELEASE_PROCESS.md](./RELEASE_PROCESS.md)
