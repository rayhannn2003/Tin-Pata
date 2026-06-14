# Tin Pata v1.1.4 — Release Checklist

Final manual QA before signing off **v1.1.4** as the stable v1.1 personal release.

**Version:** 1.1.4 · **Package:** `com.readinghabit.tracker` · **App name:** তিনপাতা (Tin Pata)

**Prerequisites**

- Production or release dev build (not Expo Go)
- Fresh install OR cleared app data for “fresh install” row
- At least one PDF on device for import/resume tests
- See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)

---

## Build & project health

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 1 | `npm install` succeeds | ☐ | |
| 2 | `npm run typecheck` passes | ☐ | |
| 3 | `npx expo-doctor` passes | ☐ | No committed `android/`/`ios/` |
| 4 | `npx expo prebuild --clean --platform android` succeeds | ☐ | |
| 5 | `eas build --platform android --profile production` succeeds | ☐ | Production APK |

---

## Fresh install & library

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 6 | Fresh install / first launch | ☐ | Onboarding, empty library |
| 7 | Import PDF | ☐ | Appears in library with progress |
| 8 | Book detail opens | ☐ | No overlapping cards; stats load |
| 9 | Per-book stats | ☐ | Sessions, pages, time reasonable |

---

## Reader & sessions

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 10 | Continue reading (home) | ☐ | Opens correct book |
| 11 | Continue reading (book detail) | ☐ | |
| 12 | Open from library | ☐ | |
| 13 | Auto-resume (page > 1) | ☐ | Brief black flash OK — not a fail |
| 14 | Manual Go to page | ☐ | User-triggered jump only |
| 15 | Bookmark add/remove/jump | ☐ | |
| 16 | Page note add/edit/delete | ☐ | |
| 17 | Finish session | ☐ | Saved with correct pages/time |
| 18 | Auto-save on back/exit | ☐ | Progress persisted |
| 19 | No duplicate sessions | ☐ | One session per open cycle |

---

## Goals, stats, rescue

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 20 | Daily goal save | ☐ | |
| 21 | Home / stats reflect sessions | ☐ | Streak updates |
| 22 | Rescue mode | ☐ | Banner + session still tracks |

---

## Settings & comfort

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 23 | Theme System / Light / Dark | ☐ | |
| 24 | Language EN ↔ BN | ☐ | Settings labels translated |
| 25 | Keep screen awake | ☐ | Active in reader only; off after exit |
| 26 | Brightness enabled | ☐ | Applies in reader (native build) |
| 27 | Brightness restores after leaving reader | ☐ | |
| 28 | Timer hidden → session still tracks | ☐ | |
| 29 | Progress hidden → page still tracks | ☐ | |
| 30 | Compact action bar | ☐ | |
| 31 | Reader comfort panel | ☐ | From action bar |
| 32 | Settings shows version **1.1.4** | ☐ | |

---

## Notifications & backup

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 33 | Notification permission flow | ☐ | Graceful if denied |
| 34 | Save reminder settings | ☐ | |
| 35 | Export JSON backup | ☐ | Share sheet works |
| 36 | Import JSON backup | ☐ | Data restored; PDFs separate |
| 37 | Brightness prefs in backup | ☐ | `reader_brightness_*` keys |

---

## Regression

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 38 | Open same book 10× | ☐ | No crash |
| 39 | Scroll 2 minutes | ☐ | No crash |
| 40 | Hardware back from reader | ☐ | Saves and exits |
| 41 | App name **তিনপাতা (Tin Pata)** in settings | ☐ | |

---

## Sign-off

- **Device:**
- **Build:** debug / production APK
- **Version:** 1.1.4
- **Date:**
- **Tester:**
- **Result:** Pass / Fail
- **Production APK URL / artifact:**
- **Issues found:**

---

## Quick commands

```bash
npm install
npm run typecheck
npx expo-doctor
npx expo prebuild --clean --platform android
npx expo run:android
npx expo start -c
eas build --platform android --profile production
```
