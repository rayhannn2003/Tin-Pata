# Tin Pata (তিনপাতা)

A personal, offline-first mobile app for building a consistent PDF reading habit. Import your books as PDFs, read them inside the app, track sessions and progress, and recover from reader's block — all stored locally on your device.

**Version 1.4.0** · Personal-use only · No backend · No cloud sync

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

## Commands

**Expo Go is not supported.** The PDF reader requires a **development or production build**.

This project uses **CNG / Prebuild** — `android/` and `ios/` are generated locally and are **not committed**. See [docs/CNG_SETUP.md](docs/CNG_SETUP.md).

```bash
# Install dependencies
npm install

# TypeScript check
npm run typecheck

# Generate native Android project (after clone or plugin changes)
npx expo prebuild --clean --platform android

# Build and install dev client on device/emulator
npx expo run:android

# Day-to-day JS development (after dev build installed)
npx expo start -c
# USB: adb reverse tcp:8081 tcp:8081

# Project health
npx expo-doctor
```

### Production APK

```bash
eas build --platform android --profile production
```

Package: `com.readinghabit.tracker` · App name: **তিনপাতা (Tin Pata)**

After changing app icon, native plugins (`expo-brightness`, PDF, notifications), or `app.json`, run prebuild + `run:android` again.

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
| [v1.4 Release Checklist](docs/V1_4_RELEASE_CHECKLIST.md) | Final QA sign-off (v1.4.0) |
| [Backup & Restore](docs/BACKUP_AND_RESTORE.md) | Export, import, relink, safety |
| [Known Limitations](docs/KNOWN_LIMITATIONS.md) | Platform, reader, backup constraints |
| [Reader Stability Checklist](docs/READER_STABILITY_TEST_CHECKLIST.md) | PDF reader QA |
| [CNG / Prebuild Setup](docs/CNG_SETUP.md) | Native folder policy |
| [Release Build Guide](docs/RELEASE_BUILD_GUIDE.md) | Dev + production APK |
| [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) | Phased plan |
| [Database Schema](docs/DATABASE_SCHEMA.md) | SQLite tables |
