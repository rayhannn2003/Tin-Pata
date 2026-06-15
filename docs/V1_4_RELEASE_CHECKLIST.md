# Tin Pata v1.4.0 — Release Checklist

Final manual QA before signing off **v1.4.0** as the stable backup and data safety release.

**Version:** 1.4.0 · **Package:** `com.readinghabit.tracker` · **App name:** তিনপাতা (Tin Pata)

**Prerequisites**

- Production or release dev build (not Expo Go)
- At least one PDF on device for reader tests
- A valid v1.4 JSON backup file for import tests
- Optional: legacy v1 backup (export_version 1) for compatibility test
- See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md) and [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md)

---

## Build & project health

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 1 | `npm install` succeeds | ☐ | |
| 2 | `npm run typecheck` passes | ☐ | |
| 3 | `npx expo-doctor` passes | ☐ | No committed `android/`/`ios/` |
| 4 | `android/` and `ios/` in `.gitignore` / `.easignore` | ☐ | CNG policy |
| 5 | `npx expo prebuild --clean --platform android` succeeds | ☐ | |
| 6 | `eas build --platform android --profile production` succeeds | ☐ | Production APK |

---

## Backup export

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 7 | Export backup successfully | ☐ | Share sheet saves JSON |
| 8 | Backup has `appName`, `backupVersion`, `appVersion`, `exportedAt` | ☐ | Open JSON file |
| 9 | Backup includes books, sessions, notes, bookmarks, settings | ☐ | |
| 10 | `pdf_files_included` is `false` | ☐ | |

---

## Backup health card

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 11 | Settings shows backup status card | ☐ | Books, notes, bookmarks |
| 12 | Last backup date shown after export | ☐ | |
| 13 | Missing PDF count shown when applicable | ☐ | After import without PDFs |
| 14 | Reminder text visible | ☐ | Before reinstall / phone change |

---

## Import preview

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 15 | Valid backup shows preview modal | ☐ | Counts, date, version |
| 16 | Invalid JSON shows friendly error | ☐ | No stack trace |
| 17 | Old backup imports with defaults | ☐ | Legacy v1 file |
| 18 | Newer app version backup warns safely | ☐ | If test file available |
| 19 | PDF-not-included warning visible | ☐ | |

---

## Restore modes

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 20 | Merge restore works | ☐ | Adds new; skips duplicate IDs |
| 21 | Replace restore requires **second** confirmation | ☐ | Two-step alert |
| 22 | Import result summary shown | ☐ | Imported + relink counts |
| 23 | Duplicate/skipped items handled safely | ☐ | No crash |

---

## Missing PDFs

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 24 | Restored book without file shows **PDF missing** | ☐ | Library badge |
| 25 | Missing PDF book cannot open reader | ☐ | Blocked with message |
| 26 | Relink PDF from Book Detail works | ☐ | |
| 27 | Relink from library menu works | ☐ | |
| 28 | Progress preserved after relink | ☐ | `current_page` unchanged |
| 29 | Notes and bookmarks preserved | ☐ | |
| 30 | Sessions preserved | ☐ | Stats unchanged |
| 31 | `current_page` clamps if new PDF has fewer pages | ☐ | Warning shown |

---

## Danger zone

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 32 | Reset all data uses **two-step** confirmation | ☐ | |
| 33 | Delete book with sessions/notes uses two-step confirm | ☐ | Shows counts |
| 34 | Destructive actions are not accidental | ☐ | Cancel works |

---

## General regression

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 35 | Library opens | ☐ | |
| 36 | Book detail opens | ☐ | |
| 37 | Reader opens for valid PDFs | ☐ | |
| 38 | Sessions save on exit | ☐ | |
| 39 | Notes and bookmarks work | ☐ | |
| 40 | Stats screen works | ☐ | |
| 41 | Language switching EN ↔ BN | ☐ | Backup + danger strings |
| 42 | Focus / fit / scroll modes unchanged | ☐ | No regression |

---

## Sign-off

- **Device:**
- **Build:** debug / release
- **Version:** 1.4.0
- **Date:**
- **Tester:**
- **Result:** Pass / Fail
- **Backup format tested:** v1 / v2
- **Import modes tested:** merge / replace
- **Issues found:**
