# Environment and Secrets

Security rules for Tin Pata v1 (local-only) and v2 (cloud).

---

## Current State (v1.4)

| Item | Status |
|------|--------|
| Backend / Supabase | ❌ Not used |
| LLM API in app | ❌ Not used |
| Auth tokens | ❌ Not used |
| Cloudinary (legacy columns) | Unused in UI; stripped on backup export |
| Data storage | SQLite + local PDF files on device |
| Secrets in repo | None required for v1 build |

v1 APK contains no server credentials — safe for personal sideload.

---

## Files to Ignore (never commit)

| Path | Reason |
|------|--------|
| `.env` | Local secrets (v2) |
| `.env.local` / `.env*.local` | Local overrides |
| `android/` / `ios/` | Generated native projects |
| `node_modules/` | Dependencies |
| `.expo/` | Local Expo cache |
| `*.jks`, `*.p8`, `*.p12`, `*.key` | Signing keys |
| `android/build`, `.gradle` caches | Build artifacts |
| `npm-debug.*`, logs | Debug noise |

Verify: `.gitignore` and `.easignore` at repo root.

---

## Local development (v2 prep)

- Use `.env` for **local-only** values (Supabase URL, anon key for dev project)
- Load via Expo env pattern (`EXPO_PUBLIC_*` for client-safe values only)
- Add `.env` to `.gitignore` — **never commit**
- Document required vars in README or `.env.example` (values empty)

---

## Future v2 Rules

| Rule | Why |
|------|-----|
| **Never** ship service-role Supabase key in mobile app | Full DB access if extracted from APK |
| **Never** embed LLM API keys in client | Keys can be scraped from APK |
| Use Supabase **anon key** only + **RLS** on all tables | Client is untrusted |
| Secret API calls → **Edge Functions** or backend | Keys stay server-side |
| Separate **dev** and **prod** Supabase projects | Prevents test data in production |
| Enable RLS **before** real user data | Default-deny policy |
| Privacy policy before public release | Legal + store requirement |

Client-safe: public Supabase URL, anon key (with RLS), feature flags.  
Server-only: service role, LLM keys, webhooks, admin tokens.

See: [V2_DEVOPS_READINESS_CHECKLIST.md](./V2_DEVOPS_READINESS_CHECKLIST.md)
