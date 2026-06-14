# Tin Pata (তিনপাতা)

A personal, offline-first mobile app for building a consistent PDF reading habit. Import your books as PDFs, read them inside the app, track sessions and progress, and recover from reader's block — all stored locally on your device.

**Personal-use only. No backend. No cloud sync in current release.**

---

## Features

- Import and store PDF books locally
- In-app PDF reader with resume, bookmarks, and page notes
- Reading sessions, daily goals, streaks, and weekly stats
- Reader's Block Rescue mode
- Theme picker (System / Light / Dark)
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

## Getting Started

**Expo Go is not supported.** The PDF reader requires a **development build**.

This project uses **CNG / Prebuild** — `android/` and `ios/` are generated locally and are **not committed**. See [docs/CNG_SETUP.md](docs/CNG_SETUP.md).

```bash
npm install
npx expo prebuild --clean --platform android
npx expo run:android
```

For day-to-day JS changes after the dev build is installed:

```bash
npx expo start
# USB: adb reverse tcp:8081 tcp:8081
```

Verify project health:

```bash
npx expo-doctor
```

---

## Brand assets

App icon: `assets/images/updatedIcon.png` (1254×1254 PNG). After changing icon or native plugins, regenerate native projects:

```bash
npx expo prebuild --clean --platform android
npx expo run:android
```

See [docs/BRAND_ASSETS.md](docs/BRAND_ASSETS.md) for paths and sizes.

---

## Production APK

```bash
eas build --platform android --profile production
```

Package: `com.readinghabit.tracker` · App name: **তিনপাতা (Tin Pata)**

---

## Documentation

| Document | Description |
|----------|-------------|
| [Brand Assets](docs/BRAND_ASSETS.md) | Icon/splash paths and sizes |
| [CNG / Prebuild Setup](docs/CNG_SETUP.md) | Native folder policy, clean rebuild |
| [Reader Stability Checklist](docs/READER_STABILITY_TEST_CHECKLIST.md) | PDF reader QA (v1.1.2) |
| [Manual Test Checklist](docs/MANUAL_TEST_CHECKLIST.md) | v1.0 release QA |
| [Release Build Guide](docs/RELEASE_BUILD_GUIDE.md) | Dev + production APK |
| [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) | Phased plan |
| [Database Schema](docs/DATABASE_SCHEMA.md) | SQLite tables |
# Tin-Pata
