# Tin Pata (তিনপাতা)

A personal, offline-first mobile app for building a consistent PDF reading habit. Import your books as PDFs, read them inside the app, track sessions and progress, and recover from reader's block — all stored locally on your device.

**Version 1.1.4** · Personal-use only · No backend · No cloud sync

---

## Features

- Import and store PDF books locally
- In-app PDF reader with safe auto-resume, bookmarks, and page notes
- Reading sessions, daily goals, streaks, and weekly stats
- Book detail with per-book stats
- Reader comfort: keep awake, brightness, UI visibility toggles
- Reader's Block Rescue mode
- Theme picker (System / Light / Dark)
- English and Bengali UI
- Local reading reminders (optional, device-only)
- JSON backup export/import (reading data — PDF files separate)
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
| [Version History](docs/VERSION_HISTORY.md) | v1.0 and v1.1 release notes |
| [v1.1 Release Checklist](docs/V1_1_RELEASE_CHECKLIST.md) | Final QA sign-off (v1.1.4) |
| [Known Limitations](docs/KNOWN_LIMITATIONS.md) | Platform, reader, backup constraints |
| [Reader Known Limitations](docs/READER_KNOWN_LIMITATIONS.md) | PDF stability details |
| [Reader Stability Checklist](docs/READER_STABILITY_TEST_CHECKLIST.md) | PDF reader QA |
| [CNG / Prebuild Setup](docs/CNG_SETUP.md) | Native folder policy |
| [Release Build Guide](docs/RELEASE_BUILD_GUIDE.md) | Dev + production APK |
| [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) | Phased plan |
| [Database Schema](docs/DATABASE_SCHEMA.md) | SQLite tables |
