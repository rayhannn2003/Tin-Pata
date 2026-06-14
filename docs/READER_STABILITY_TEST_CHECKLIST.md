# Reader Stability Test Checklist

Tin Pata v1.1.4A (internal) — manual regression tests for the PDF reader. App version remains **1.1.3** until final sign-off.

**Prerequisites**

- Android development build installed (see [CNG_SETUP.md](./CNG_SETUP.md))
- At least one imported PDF with saved progress (page > 1)
- Optional: a large PDF (100+ pages) for stress testing
- Read [READER_KNOWN_LIMITATIONS.md](./READER_KNOWN_LIMITATIONS.md) for expected black flash on resume

---

## v1.1.4A — Stability cleanup (priority)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 1 | Open same book **20 times** | ☐ | No crash; resume stable |
| 2 | Open from **Continue Reading** | ☐ | Auto-resume via initial `page` prop |
| 3 | Open from **Library** | ☐ | |
| 4 | Open from **Book Detail** | ☐ | |
| 5 | Close/reopen repeatedly (10×) | ☐ | No duplicate sessions |
| 6 | Scroll PDF for **2 minutes** | ☐ | No crash |
| 7 | Finish session | ☐ | Session saved correctly |
| 8 | Auto-save on exit | ☐ | Progress persisted |
| 9 | Confirm **no duplicate sessions** | ☐ | One active session per open |
| 10 | Confirm **no crash** on any path above | ☐ | |

---

## Resume UX (v1.1.4A copy)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 11 | Saved page > 1 while loading | ☐ | “Opening your last page…” (no center spinner overlay) |
| 12 | Auto-resume succeeds | ☐ | Brief “Resumed from page X” |
| 13 | Auto-resume fails (stays on page 1) | ☐ | Manual fallback banner after ~1.5s |
| 14 | Black flash on open | ☐ | May occur briefly — known limitation, not a fail |

---

## Settings UI

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 15 | Reading Experience shows 4 toggles | ☐ | Keep awake, timer, progress, compact bar |
| 16 | “Coming later” note visible | ☐ | Focus, fit, scroll, default focus — not as usable controls |
| 17 | No disabled switch rows for risky prefs | ☐ | |

---

## Safe auto-resume (carry-over from v1.1.3)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 18 | Open PDF with `current_page = 1` | ☐ | No resume banner |
| 19 | Read to page 10, exit, reopen | ☐ | Opens on page 10 |
| 20 | No app exit during resume | ☐ | |
| 21 | **Go to Page** modal works | ☐ | User-triggered `setPage` only |
| 22 | Bookmark/list jump works | ☐ | User-triggered only |
| 23 | Page tracking updates `current_page` | ☐ | Via `onPageChanged` |
| 24 | No `PdfFile.getMaxPageWidth()` NPE | ☐ | |

---

## Regression

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 25 | Hardware Back saves and exits | ☐ | |
| 26 | Book detail cards do not overlap | ☐ | |
| 27 | Focus mode hidden in reader | ☐ | Safe stability mode |
| 28 | `npm run typecheck` passes | ☐ | |
| 29 | `npx expo-doctor` passes | ☐ | No committed `android/`/`ios/` |
| 30 | Production APK build works | ☐ | `eas build --profile production` |

---

## If auto-resume regresses

If the initial `page` prop causes repeated black flash or native crash:

1. Revert to v1.1.2 passive-only resume in `PdfViewer.native.tsx` (remove `page` prop).
2. Document in [READER_KNOWN_LIMITATIONS.md](./READER_KNOWN_LIMITATIONS.md).
3. Keep manual fallback banner as the only resume path.

---

## Sign-off

- **Device:**
- **Build:** debug / release
- **Version:** 1.1.3 (v1.1.4A internal)
- **Date:**
- **Tester:**
- **Result:** Pass / Fail
- **Auto-resume mechanism:** initial `page` prop / fallback only
- **Stability mode:** safe
- **Issues found:**
