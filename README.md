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

**PDF reader requires an Android development build — not Expo Go.**

```bash
npm install
npx expo run:android
```

For day-to-day JS changes after the dev build is installed:

```bash
npx expo start
```

---

## Brand assets

App icon: `assets/images/updatedIcon.png` (1254×1254 PNG). After changing icon or name, rebuild the native app:

```bash
npx expo prebuild --platform android
cd android && ./gradlew app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
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
| [Manual Test Checklist](docs/MANUAL_TEST_CHECKLIST.md) | v1.0 release QA |
| [Release Build Guide](docs/RELEASE_BUILD_GUIDE.md) | Dev + production APK |
| [Development Roadmap](docs/DEVELOPMENT_ROADMAP.md) | Phased plan |
| [Database Schema](docs/DATABASE_SCHEMA.md) | SQLite tables |
# Tin-Pata
