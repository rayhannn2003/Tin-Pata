# Reader Stability Test Checklist

Tin Pata v1.3.0 — manual regression tests for the PDF reader.

**Prerequisites**

- Android development build installed (see [CNG_SETUP.md](./CNG_SETUP.md))
- At least one imported PDF with saved progress (page > 1)
- Optional: a large PDF (100+ pages) for stress testing
- Read [READER_KNOWN_LIMITATIONS.md](./READER_KNOWN_LIMITATIONS.md) for expected black flash on resume

---

## v1.3.0 — Safe reader modes (priority)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 1 | **Vertical scroll mode** (default) | ☐ | Continuous vertical scroll; `enablePaging` false |
| 2 | **Horizontal scroll mode** | ☐ | Page-by-page swipe; set in Settings, reopen reader |
| 3 | Change scroll mode while reader open | ☐ | No change until reader closed and reopened |
| 4 | **Fit modes** (Auto / Width / Page) | ☐ | Each applies on next reader open only |
| 5 | **Focus Mode** in vertical scroll | ☐ | Toolbar/action bar hidden; PDF scrollable; back exits focus |
| 6 | **Focus Mode** in horizontal scroll | ☐ | Same UI behavior; paging still works if safe |
| 7 | Open same PDF **10 times** | ☐ | No crash in either scroll mode |
| 8 | **Continue Reading** | ☐ | Auto-resume via initial `page` prop |
| 9 | Auto-resume succeeds or fallback works | ☐ | Banner / manual jump if stuck on page 1 |
| 10 | **Manual Go to Page** | ☐ | User-triggered `setPage` only |
| 11 | **Bookmark jump** | ☐ | User-triggered only |
| 12 | Session timer works | ☐ | |
| 13 | Auto-save on exit works | ☐ | Progress persisted |
| 14 | Black flash on open | ☐ | May occur briefly — known limitation, not a fail |

---

## v1.1.4A — Stability cleanup (carry-over)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 15 | Open from **Library** | ☐ | |
| 16 | Open from **Book Detail** | ☐ | |
| 17 | Close/reopen repeatedly (10×) | ☐ | No duplicate sessions |
| 18 | Scroll/read PDF for **2 minutes** | ☐ | No crash |
| 19 | Finish session | ☐ | Session saved correctly |
| 20 | Confirm **no duplicate sessions** | ☐ | One active session per open |

---

## Settings UI

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 21 | Reading Experience shows fit + scroll pickers | ☐ | Chip selectors with “applies next open” helper |
| 22 | Horizontal scroll warning visible | ☐ | EN and BN |
| 23 | Default focus mode toggle | ☐ | |
| 24 | Comfort toggles (timer, progress, compact bar) | ☐ | |

---

## v1.1.4B — Safe reader comfort (carry-over)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 25 | Reader brightness applies in reader | ☐ | |
| 26 | Brightness restores after leaving reader | ☐ | |
| 27 | Keep screen awake on reader only | ☐ | |
| 28 | Language switching works | ☐ | EN ↔ BN for reader prefs |
| 29 | Reader prefs in JSON backup | ☐ | fit, scroll, focus, brightness |

---

## Safe auto-resume (carry-over)

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 30 | Open PDF with `current_page = 1` | ☐ | No resume banner |
| 31 | Read to page 10, exit, reopen | ☐ | Opens on page 10 |
| 32 | No app exit during resume | ☐ | |
| 33 | Page tracking updates `current_page` | ☐ | Via `onPageChanged` |
| 34 | No `PdfFile.getMaxPageWidth()` NPE | ☐ | |

---

## Regression & release

| # | Test | Pass? | Notes |
|---|------|-------|-------|
| 35 | Hardware Back saves and exits | ☐ | Focus mode exits first, then reader |
| 36 | Book detail cards do not overlap | ☐ | |
| 37 | `npm run typecheck` passes | ☐ | |
| 38 | `npx expo-doctor` passes | ☐ | No committed `android/`/`ios/` |
| 39 | Production APK build works | ☐ | `eas build --profile production` |

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
- **Version:** 1.3.0
- **Date:**
- **Tester:**
- **Result:** Pass / Fail
- **Auto-resume mechanism:** initial `page` prop / fallback only
- **Stability mode:** safe
- **Scroll mode tested:** vertical / horizontal
- **Issues found:**
