# Tin Pata (তিনপাতা) — Manual Test Checklist v1.0

Personal Android release validation. Test on a **real device** with a **development build** or **production APK**. Expo Go is **not supported**.

Mark each item: ✅ Pass · ❌ Fail · ⏭ Skipped

---

## A. Fresh Install

| # | Test | Expected | Result |
|---|------|----------|--------|
| A1 | Install APK on clean device | Installs without error | |
| A2 | First launch | No crash | |
| A3 | Onboarding modal | Appears once on first launch | |
| A4 | Complete onboarding | Modal closes; does not reappear after restart | |
| A5 | Skip onboarding | Modal closes; does not reappear after restart | |
| A6 | Theme | System/Light/Dark loads without crash | |
| A7 | Empty Home | Empty states show Bengali copy | |
| A8 | Empty Library | "এখনও কোনো PDF নেই" or similar | |
| A9 | Tab navigation | All 4 tabs work | |

---

## B. Library

| # | Test | Expected | Result |
|---|------|----------|--------|
| B1 | Import valid PDF | Book appears in library | |
| B2 | Import cancelled | No crash; no partial book | |
| B3 | Import non-PDF (if picker allows) | Graceful error | |
| B4 | Rename book | Title updates in list | |
| B5 | Search by title | Filters correctly | |
| B6 | Filter: Reading | Shows reading books only | |
| B7 | Filter: Paused | Shows paused books only | |
| B8 | Filter: Finished | Shows finished books only | |
| B9 | Mark as reading / finished | Status updates | |
| B10 | Delete book | Removed from list; PDF file deleted | |
| B11 | Missing PDF file | Open book shows error, not crash | |
| B12 | Kill and relaunch | Library persists | |

---

## C. Reader

| # | Test | Expected | Result |
|---|------|----------|--------|
| C1 | Open PDF | Renders pages | |
| C2 | Resume | Opens at last saved page after restart | |
| C3 | Swipe / scroll pages | Page changes | |
| C4 | Prev/Next buttons | Page changes | |
| C5 | Jump to page | Navigates correctly | |
| C6 | Page count | Total pages displayed | |
| C7 | Current page saves | Debounced save on page change | |
| C8 | Back button | Returns to previous screen | |
| C9 | Background app | Page progress kept | |
| C10 | Finish session flow | Modal → save works | |
| C11 | Short session (< threshold) | Not saved; page kept | |
| C12 | Timer | Runs while reading; pauses in background | |

---

## D. Sessions

| # | Test | Expected | Result |
|---|------|----------|--------|
| D1 | Normal session save | Row in DB; stats update | |
| D2 | Meaningful session auto-save | Saved on back if long enough | |
| D3 | Short session | Not saved with message | |
| D4 | Focus/mood/blocker optional | Saved when provided | |
| D5 | Home summary | Updates after session | |
| D6 | Stats screen | Updates after session | |

---

## E. Goals and Streaks

| # | Test | Expected | Result |
|---|------|----------|--------|
| E1 | Default goal | Appears on Home | |
| E2 | Change goal to pages | Saves and displays | |
| E3 | Change goal to minutes | Saves and displays | |
| E4 | Goal progress | Updates as you read | |
| E5 | Streak | Increments on consecutive reading days | |
| E6 | Streak reset | Resets after missed day (no guilt copy) | |
| E7 | Weekly calendar | Shows reading days | |

---

## F. Bookmarks

| # | Test | Expected | Result |
|---|------|----------|--------|
| F1 | Add bookmark | Saved on current page | |
| F2 | Remove bookmark | Removed from list | |
| F3 | Bookmark list | Opens from reader | |
| F4 | Jump to bookmark | Navigates to page | |
| F5 | Empty bookmark list | Empty state shown | |

---

## G. Notes

| # | Test | Expected | Result |
|---|------|----------|--------|
| G1 | Add note | Saved on page | |
| G2 | Edit note | Text updates | |
| G3 | Delete note | Removed | |
| G4 | Notes list | Opens from reader | |
| G5 | Jump to note page | Navigates correctly | |
| G6 | Empty notes list | Empty state shown | |

---

## H. Rescue Mode

| # | Test | Expected | Result |
|---|------|----------|--------|
| H1 | Start 1-page rescue | Opens reader overlay | |
| H2 | Complete 1-page rescue | Session/progress saved | |
| H3 | Start 3-minute rescue | Countdown runs | |
| H4 | Complete 3-minute rescue | Success message | |
| H5 | Write reflection | Saves to settings history | |
| H6 | Reflection history | Shows in Settings | |
| H7 | Delete reflection | Removed from list | |

---

## I. Notifications

| # | Test | Expected | Result |
|---|------|----------|--------|
| I1 | Fresh install — no permission prompt | No prompt until enabling reminder | |
| I2 | Enable daily reminder | Permission prompt appears | |
| I3 | Save reminders | Settings persist | |
| I4 | Test notification | Arrives within ~5 seconds | |
| I5 | Daily reminder scheduled | "Show scheduled reminders" count > 0 | |
| I6 | Missed goal reminder | Schedules when enabled | |
| I7 | Rescue reminder | Schedules when enabled | |
| I8 | Disable all reminders | Scheduled count goes to 0 | |
| I9 | Channel name | `তিনপাতা রিমাইন্ডার` in Android settings | |
| I10 | Notification copy | Bengali body text | |
| I11 | Notification icon | Shows icon (or app icon fallback) | |

---

## J. Theme

| # | Test | Expected | Result |
|---|------|----------|--------|
| J1 | System theme | Follows device | |
| J2 | Light theme | Light UI | |
| J3 | Dark theme | Dark UI | |
| J4 | Restart app | Theme persists | |

---

## K. Export / Import

| # | Test | Expected | Result |
|---|------|----------|--------|
| K1 | Export JSON | Share sheet opens; valid JSON file | |
| K2 | JSON contains metadata | books, sessions, bookmarks, notes, goals, reflections, settings | |
| K3 | JSON excludes PDFs | `pdf_files_included: false` | |
| K4 | Reset app data | All data cleared | |
| K5 | Import JSON (replace) | Confirmation shown before import | |
| K6 | Import valid backup | Data restored | |
| K7 | Books metadata | Titles, pages, status restored | |
| K8 | Sessions restored | Stats reflect imported sessions | |
| K9 | Bookmarks/notes restored | Visible in reader | |
| K10 | Goals/settings restored | Settings screen correct | |
| K11 | Invalid JSON | Error shown; DB unchanged | |
| K12 | Wrong export version | Error shown; DB unchanged | |
| K13 | PDF paths | Missing files marked; no crash on open | |

---

## L. Production Build

| # | Test | Expected | Result |
|---|------|----------|--------|
| L1 | `npm run typecheck` | Passes | |
| L2 | EAS production APK build | Completes successfully | |
| L3 | Install production APK | Installs on device | |
| L4 | App opens | No dev-client launcher UI | |
| L5 | PDF reader | Works in production APK | |
| L6 | Notifications | Work in production APK | |
| L7 | Signature mismatch | Document: uninstall old app first | |

---

## Notes

- **Dev build** shows Expo development UI — expected during development.
- **Production APK** should not require Metro for release use (pre-bundled JS in standalone build).
- Record device model, Android version, and APK type (dev vs production) when testing.
