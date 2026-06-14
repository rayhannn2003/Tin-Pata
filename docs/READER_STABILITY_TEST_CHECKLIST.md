# Reader Stability Test Checklist

Tin Pata v1.1.3 — manual regression tests for the PDF reader.

**Prerequisites**

- Android development build installed (see [CNG_SETUP.md](./CNG_SETUP.md))
- At least one imported PDF with saved progress (page > 1)
- Optional: a large PDF (100+ pages) for stress testing

---

## v1.1.3 — Safe auto-resume (priority)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 1 | Open PDF with `current_page = 1` | ☐ | No resume banner |
| 2 | Read to page 10, exit, reopen | ☐ | Opens directly on page 10 |
| 3 | No black flash loop on open | ☐ | |
| 4 | No app exit during resume | ☐ | |
| 5 | Open same book **20 times** from Continue Reading | ☐ | Stable each time |
| 6 | **Go to Page** modal still works | ☐ | User-triggered `setPage` only |
| 7 | Bookmark/list jump still works | ☐ | User-triggered only |
| 8 | Fallback banner if auto-resume fails | ☐ | “Last read” + manual button; no auto jump |
| 9 | Page tracking updates `current_page` | ☐ | Via `onPageChanged` |
| 10 | Session timer works | ☐ | |
| 11 | Auto-save on exit works | ☐ | |
| 12 | No `PdfFile.getMaxPageWidth()` NPE | ☐ | |
| 13 | `npm run typecheck` passes | ☐ | |
| 14 | Production APK build works | ☐ | `eas build --profile production` |

---

## Resume UX messages

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 15 | Saved page > 1 while loading | ☐ | Shows “Opening page X…” |
| 16 | Auto-resume succeeds | ☐ | Brief “Resumed from page X” then hides |
| 17 | Auto-resume fails (stays on page 1) | ☐ | Fallback banner + manual button after ~1.5s |

---

## Regression (v1.1.2 carry-over)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 18 | Scroll PDF for 2 minutes | ☐ | No crash |
| 19 | Hardware Back saves and exits | ☐ | |
| 20 | Book detail cards do not overlap | ☐ | |
| 21 | Focus mode hidden | ☐ | |
| 22 | `npx expo-doctor` passes | ☐ | No committed `android/`/`ios/` |

---

## If auto-resume regresses

If the initial `page` prop causes black flash or native crash again:

1. Revert to v1.1.2 passive-only resume in `PdfViewer.native.tsx` (remove `page` prop).
2. Document in this file that react-native-pdf auto-resume is unstable on the test device.
3. Keep manual fallback banner as the only resume path.

---

## Sign-off

- **Device:**
- **Build:** debug / release
- **Version:** 1.1.3
- **Date:**
- **Tester:**
- **Result:** Pass / Fail
- **Auto-resume mechanism:** initial `page` prop / fallback only
- **Issues found:**
