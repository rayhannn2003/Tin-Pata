# Tin Pata (তিনপাতা)

A personal, offline-first mobile app for building a consistent PDF reading habit. Import your books as PDFs, read them inside the app, track sessions and progress, and recover from reader's block — all stored locally on your device.

**Version 2.0.0-alpha.4** · Personal-use · Optional cloud account · **Metadata sync + optional PDF cloud backup**

---

## Privacy & local-first

- All reading data stays **on your device** — no account, no server, no cloud library sync
- JSON backup exports **reading metadata only** — sessions, notes, bookmarks, goals, settings
- **PDF files are not included** in JSON backup; copy PDFs separately or use **Relink PDF** after restore

---

## Backup, restore & PDF relink

| Action | What it does |
|--------|----------------|
| **Export backup (JSON)** | Saves reading data to a shareable `.json` file |
| **Import backup** | Preview → choose **merge** or **replace** → confirm → result summary |
| **Relink PDF** | Attach a PDF file to a restored book; progress, notes, and bookmarks stay |

After importing on a new phone, books may show **PDF missing** until you relink each PDF from Book Detail or the library.

Full guide: [docs/BACKUP_AND_RESTORE.md](docs/BACKUP_AND_RESTORE.md)

---

## Features

- Import and store PDF books locally
- In-app PDF reader with safe auto-resume, bookmarks, and page notes
- Safe reader modes: Focus, Fit, Scroll (session-frozen at open)
- Library organization: categories, priority, sort, and filters
- Global notes and bookmarks search
- Reading sessions, daily goals, streaks, stats, and reading insights
- Book detail with analytics and estimated finish date
- Reader comfort: keep awake, brightness, UI visibility toggles
- Reader's Block Rescue mode
- JSON backup with validation, preview, merge/replace restore
- Missing PDF detection and relink flow
- Theme picker (System / Light / Dark)
- English and Bengali UI
- Local reading reminders (optional, device-only)
- Onboarding and polished home dashboard

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | Expo SDK **54** + React Native |
| Language | TypeScript |
| Navigation | Expo Router |
| Database | SQLite (expo-sqlite) |
| PDF | react-native-pdf (dev build required) |
| Notifications | expo-notifications (local only) |

---

## Development & release

**Expo Go is not supported.** Native modules (PDF, notifications) require a **dev client**.

**CNG / Prebuild:** `android/` and `ios/` are generated from `app.json` — **not committed**. See [CNG_SETUP.md](docs/CNG_SETUP.md).

| Task | Command |
|------|---------|
| Install | `npm install` |
| Typecheck | `npm run typecheck` |
| Health check | `npx expo-doctor` |
| Metro (daily JS work) | `npx expo start -c` |
| USB Metro | `adb reverse tcp:8081 tcp:8081` |
| Regenerate native project | `npx expo prebuild --clean --platform android` |
| Dev client build + install | `npx expo run:android` |
| Production APK | `eas build --platform android --profile production` |
| Test APK | `eas build --platform android --profile preview` |

**Before risky changes** (reset data, replace import, major upgrade): export JSON backup in Settings. PDFs are not in the backup — relink after restore.

Full DevOps guide: [docs/DEVOPS_AND_RELEASE_ENGINEERING.md](docs/DEVOPS_AND_RELEASE_ENGINEERING.md) · Release: [RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md) · Rollback: [ROLLBACK_AND_RECOVERY.md](docs/ROLLBACK_AND_RECOVERY.md) · Secrets: [ENVIRONMENT_AND_SECRETS.md](docs/ENVIRONMENT_AND_SECRETS.md)

### Supabase (optional — v2.0A auth)

Cloud sign-in is **optional**. Reading data stays local until a future sync phase.

```bash
cp .env.example .env
# Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
# Run docs/V2_SUPABASE_SETUP.sql in Supabase SQL Editor
npx expo start -c
```

Without `.env`, the app works fully in local-only mode. See [docs/V2_AUTH_FOUNDATION.md](docs/V2_AUTH_FOUNDATION.md).

After adding native auth dependencies, rebuild dev client once: `npx expo prebuild --clean --platform android && npx expo run:android`.

After changing `app.json` plugins, icon, splash, or permissions → prebuild + `run:android` again (Metro alone is not enough).

---

## Brand assets

App icon: `assets/images/updatedIcon.png` (1254×1254 PNG).

See [docs/BRAND_ASSETS.md](docs/BRAND_ASSETS.md) for paths and sizes.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Version History](docs/VERSION_HISTORY.md) | Release notes (v1.0–v1.4) |
| [Engineering Architecture](docs/ENGINEERING_ARCHITECTURE.md) | System design, data flows, v2 bridge |
| [Database Audit](docs/DB_AUDIT.md) | SQLite schema audit (v1.5B) |
| [Backup Audit](docs/BACKUP_AUDIT.md) | Import/export audit (v1.5B) |
| [v2 Data Readiness](docs/V2_DATA_READINESS_CHECKLIST.md) | Pre-sync checklist |
| [Frontend Performance Audit](docs/FRONTEND_PERFORMANCE_AUDIT.md) | Rendering, lists, reader (v1.5C) |
| [v2 Frontend Readiness](docs/V2_FRONTEND_READINESS_CHECKLIST.md) | Pre-cloud UI checklist |
| [DevOps & Release Engineering](docs/DEVOPS_AND_RELEASE_ENGINEERING.md) | Build model, CNG, Metro vs native (v1.5D) |
| [Release Process](docs/RELEASE_PROCESS.md) | Versioning, checklist, EAS profiles |
| [Rollback & Recovery](docs/ROLLBACK_AND_RECOVERY.md) | Git, data, build recovery |
| [Environment & Secrets](docs/ENVIRONMENT_AND_SECRETS.md) | v1/v2 secrets policy |
| [v2 DevOps Readiness](docs/V2_DEVOPS_READINESS_CHECKLIST.md) | Pre-cloud infra checklist |
| [v2 Auth Foundation](docs/V2_AUTH_FOUNDATION.md) | Supabase auth (v2.0A) |
| [v2 Auth Test Checklist](docs/V2_AUTH_TEST_CHECKLIST.md) | Auth QA checklist |
| [v2 Local Sync Fields](docs/V2_LOCAL_SYNC_FIELDS.md) | Sync metadata + device id (v2.0B) |
| [v2 Sync Strategy](docs/V2_SYNC_STRATEGY.md) | Cloud sync phase plan |
| [v2 Local Sync Test Checklist](docs/V2_LOCAL_SYNC_FIELDS_TEST_CHECKLIST.md) | v2.0B QA checklist |
| [v2 Metadata Sync](docs/V2_METADATA_SYNC.md) | Sync queue + manual sync (v2.0C) |
| [v2 Metadata Sync Test Checklist](docs/V2_METADATA_SYNC_TEST_CHECKLIST.md) | v2.0C QA checklist |
| [v2 Supabase Metadata Schema](docs/V2_SUPABASE_METADATA_SCHEMA.sql) | Postgres tables for sync |
| [v2 PDF Cloud Backup](docs/V2_PDF_CLOUD_BACKUP.md) | Supabase Storage PDF backup (v2.0D) |
| [v2 Supabase Storage Setup](docs/V2_SUPABASE_STORAGE_SETUP.sql) | Storage bucket + policies |
| [v2 PDF Cloud Test Checklist](docs/V2_PDF_CLOUD_BACKUP_TEST_CHECKLIST.md) | v2.0D QA checklist |
| [v2 Storage Strategy](docs/V2_STORAGE_STRATEGY.md) | Local + cloud storage plan |
| [v1.4 Release Checklist](docs/V1_4_RELEASE_CHECKLIST.md) | Final QA sign-off (v1.4.0) |
| [Backup & Restore](docs/BACKUP_AND_RESTORE.md) | Export, import, relink, safety |
| [Known Limitations](docs/KNOWN_LIMITATIONS.md) | Platform, reader, backup constraints |
| [Reader Stability Checklist](docs/READER_STABILITY_TEST_CHECKLIST.md) | PDF reader QA |
| [CNG / Prebuild Setup](docs/CNG_SETUP.md) | Native folder policy |
| [Release Build Guide](docs/RELEASE_BUILD_GUIDE.md) | Dev + production APK |
| [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) | Phased plan |
| [Database Schema](docs/DATABASE_SCHEMA.md) | SQLite tables |
