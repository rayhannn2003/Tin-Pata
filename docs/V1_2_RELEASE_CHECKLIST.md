# Tin Pata v1.2.0 — Release Checklist

Final manual QA before signing off **v1.2.0** as the stable v1.2 release.

**Version:** 1.2.0 · **Package:** `com.readinghabit.tracker` · **App name:** তিনপাতা (Tin Pata)

**Prerequisites**

- Production or release dev build (not Expo Go)
- Fresh install OR cleared app data for “fresh install” row
- At least two PDFs on device for library/search tests
- Multiple finished sessions across 2+ days for insights / estimated finish
- See [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)

---

## Build & project health

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 1 | `npm install` succeeds | ☐ | |
| 2 | `npm run typecheck` passes | ☐ | |
| 3 | `npx expo-doctor` passes | ☐ | No committed `android/`/`ios/` |
| 4 | `npx expo prebuild --clean --platform android` succeeds | ☐ | CNG setup |
| 5 | `eas build --platform android --profile production` succeeds | ☐ | Production APK |

---

## Library organization (v1.2A)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 6 | Assign category to book | ☐ | Library menu or book detail |
| 7 | Assign priority (low/normal/high) | ☐ | |
| 8 | Filter by status chips | ☐ | All / Reading / Paused / Finished |
| 9 | Filter & sort modal | ☐ | Category, priority, sort options |
| 10 | Sort by title, progress, priority | ☐ | |
| 11 | Default sort: recently read | ☐ | |

---

## Notes & bookmarks (v1.2B)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 12 | Settings → All notes | ☐ | Shows notes from all books |
| 13 | Settings → All bookmarks | ☐ | |
| 14 | Search notes (text, book title, page) | ☐ | |
| 15 | Search bookmarks | ☐ | |
| 16 | Tap note/bookmark → reader opens | ☐ | Safe resume or fallback banner |
| 17 | Book detail recent notes/bookmarks | ☐ | View all links work |

---

## Stats & insights (v1.2C)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 18 | Stats sections: Today / Week / All Time / Insights / Calendar | ☐ | Not overcrowded |
| 19 | Insights card shows data after sessions | ☐ | Best day, averages, etc. |
| 20 | Mood/focus/blocker insights | ☐ | Only if survey data saved |

---

## Book detail analytics (v1.2C)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 21 | Reading analytics card | ☐ | Avg pages/min, best session |
| 22 | Estimated finish (2+ reading days) | ☐ | Or unavailable message |
| 23 | Totals card still correct | ☐ | Sessions, minutes, pages |

---

## Reader & sessions (regression)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 24 | Continue reading / open reader | ☐ | No PDF behavior changes |
| 25 | Auto-resume (page > 1) | ☐ | Brief black flash OK |
| 26 | Finish session | ☐ | Saved correctly |
| 27 | Session save on back | ☐ | |

---

## Backup, i18n, settings

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 28 | Export JSON backup | ☐ | Includes category/priority |
| 29 | Import old backup (no category/priority) | ☐ | Defaults applied |
| 30 | Import v1.2 backup | ☐ | Full restore |
| 31 | Language EN ↔ BN | ☐ | Insights, library, annotations labels |
| 32 | Settings shows version **1.2.0** | ☐ | |
| 33 | Notifications save/reschedule | ☐ | |

---

## Regression

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 34 | Open same book 10× | ☐ | No crash |
| 35 | Hardware back from reader | ☐ | |
| 36 | Theme picker | ☐ | |
| 37 | Rescue mode | ☐ | |

---

## Sign-off

- **Device:**
- **Build:** debug / production APK
- **Version:** 1.2.0
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
