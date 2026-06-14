# Development Roadmap

Phased implementation plan for building the Reading Habit Tracker incrementally. Complete each phase and verify before starting the next.

---

## Release status (June 2026)

| Version | Status | Notes |
|---------|--------|-------|
| **v1.0.0** | Shipped | Stable personal APK — core reading habit features |
| **v1.1.4** | **Current stable** | Reader comfort + stability — see [VERSION_HISTORY.md](./VERSION_HISTORY.md) |

**v1.1.4 QA:** [V1_1_RELEASE_CHECKLIST.md](./V1_1_RELEASE_CHECKLIST.md) · **Limitations:** [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md)

---

## Overview

| Phase | Focus | Depends On |
|-------|-------|------------|
| 1 | Project setup, navigation, SQLite, basic UI | — |
| 2 | PDF import, local storage, library | Phase 1 |
| 3 | PDF reader, page tracking, resume | Phase 2 |
| 4 | Reading sessions, timer, pages calculation | Phase 3 |
| 5 | Daily goals, streak, basic stats | Phase 4 |
| 6 | Rescue mode, bookmarks, notes | Phase 5 |
| 7 | Optional Cloudinary backup + backend | Phase 6 |

**MVP complete after Phase 6.** Phase 7 is optional enhancement.

---

## Phase 1: Foundation

**Goal:** Runnable Expo app with navigation, database, and placeholder screens.

### Tasks

- [ ] Initialize Expo project with TypeScript template
- [ ] Install core dependencies: `expo-router`, `expo-sqlite`, `expo-file-system`
- [ ] Configure Expo Router file-based routing
- [ ] Create tab layout: Home, Library, Stats, Settings
- [ ] Create reader stack route: `reader/[bookId].tsx` (placeholder)
- [ ] Set up folder structure per Architecture doc
- [ ] Implement SQLite init and migration runner (`src/db/database.ts`)
- [ ] Run migration v1 — create all tables (empty app)
- [ ] Create repository stubs: Book, Session, Bookmark, Note, Goal, Settings
- [ ] Build placeholder UI for all 5 screens with calm styling
- [ ] Add `SettingsService` with reset data function (for dev testing)
- [ ] Configure `tsconfig` with strict mode and path aliases (`@/`)

### Deliverables

- App launches on device/simulator
- Tab navigation works between 4 screens
- SQLite database created on first launch
- Empty states visible on each screen

### Verify

```
✓ npx expo start — app runs without errors
✓ Navigate all tabs
✓ Relaunch app — DB persists (schema_migrations row exists)
✓ Settings → Reset data — clears tables
```

### Suggested Cursor Prompt

> "Implement Phase 1 from docs/DEVELOPMENT_ROADMAP.md. Set up Expo + TypeScript + Expo Router with tab navigation, SQLite migrations from docs/DATABASE_SCHEMA.md, and placeholder screens per docs/USER_FLOWS.md."

---

## Phase 2: PDF Library

**Goal:** Import PDFs, store locally, display library list.

### Tasks

- [ ] Install `expo-document-picker`
- [ ] Implement `PdfFileService` (pick, copy, exists, delete, getSize)
- [ ] Create `pdfs/` directory on app init
- [ ] Implement `BookRepository` CRUD
- [ ] Implement `BookService.createFromImport()`
- [ ] Build `useImportBook` feature hook
- [ ] Library screen: book list with title, progress, status
- [ ] Add PDF button → document picker flow
- [ ] Rename book (modal)
- [ ] Delete book (confirm + cascade + file delete)
- [ ] Status filter chips on library
- [ ] Empty state with import CTA

### Deliverables

- Import PDF from phone storage
- PDF copied to app document directory
- Book metadata in SQLite
- Library shows all imported books

### Verify

```
✓ Import a PDF — appears in library
✓ Kill and relaunch — book still listed
✓ Rename book — title updates
✓ Delete book — removed from list and file deleted from storage
✓ Import 3 PDFs — all listed with correct file sizes
```

### Suggested Cursor Prompt

> "Implement Phase 2 from docs/DEVELOPMENT_ROADMAP.md. Add PDF import with expo-document-picker, local storage per docs/STORAGE_STRATEGY.md, BookService, and Library screen per docs/FEATURES.md section A."

---

## Phase 3: PDF Reader

**Goal:** Open and read PDFs in-app with page tracking and resume.

### Tasks

- [ ] Evaluate and install PDF viewer (`react-native-pdf` or alternative)
- [ ] Set up Expo dev client if native module required
- [ ] Implement reader screen with PDF component
- [ ] Load PDF from `books.local_uri`
- [ ] Display current page / total pages
- [ ] Page navigation: swipe, prev/next buttons
- [ ] Jump to page modal
- [ ] On open: navigate to `books.current_page`
- [ ] Auto-save `current_page` on page change (debounced)
- [ ] Save page on app background (`useAppState` hook)
- [ ] Update `books.total_pages` when PDF reports page count
- [ ] Update `books.status` to `reading` on first open
- [ ] Home screen "Continue Reading" card → navigate to reader
- [ ] Handle missing file error gracefully

### Deliverables

- Full-screen PDF reader
- Resume from last page after app restart
- Page indicator accurate

### Verify

```
✓ Open book → PDF renders
✓ Navigate to page 20 → close app → reopen → page 20
✓ Total pages displayed correctly
✓ Jump to page 50 works
✓ Continue Reading on Home opens correct book and page
```

### Suggested Cursor Prompt

> "Implement Phase 3 from docs/DEVELOPMENT_ROADMAP.md. Build the PDF reader screen with page navigation, auto-save progress, and resume reading per docs/FEATURES.md section B."

---

## Phase 4: Reading Sessions

**Goal:** Track reading time and pages per session.

### Tasks

- [ ] Implement `ReadingSessionRepository`
- [ ] Implement `ReadingSessionService` (start, finish, calculate)
- [ ] Build `useReadingSession` feature hook with timer
- [ ] Auto-start session when reader mounts
- [ ] Timer display in reader header
- [ ] Pause timer on `AppState` background; resume on foreground
- [ ] "Finish Session" button in reader
- [ ] Optional survey modal (focus, mood, blocker — skippable)
- [ ] Save session on finish: pages_read, duration_seconds
- [ ] Back navigation: confirm save if session > 30 seconds
- [ ] Update book progress and status on session end
- [ ] Session summary toast after finish

### Deliverables

- Every reading period recorded as a session
- Timer accurate (excludes background time)
- Pages read calculated correctly

### Verify

```
✓ Read pages 10→15, finish session — session shows 5 pages_read
✓ Timer shows elapsed time; pauses in background
✓ Back button with 2+ min session — prompts to save
✓ Skip survey — session still saved
✓ Multiple sessions same day — all recorded
```

### Suggested Cursor Prompt

> "Implement Phase 4 from docs/DEVELOPMENT_ROADMAP.md. Add reading session tracking with timer, finish flow, and optional survey per docs/FEATURES.md section C."

---

## Phase 5: Goals, Streaks & Stats

**Goal:** Daily goals, streak tracking, and stats dashboard.

### Tasks

- [ ] Implement `GoalRepository` and `GoalService`
- [ ] Settings: set daily goal (pages or minutes)
- [ ] Home: today's goal progress bar
- [ ] Goal completion detection and subtle UI feedback
- [ ] Implement `StreakService` (current, longest, reading day rules)
- [ ] Streak display on Home
- [ ] Recovery messages (non-guilt) when streak is 0
- [ ] Implement `StatsService` (today, weekly, finished count)
- [ ] Stats screen with all MVP metrics
- [ ] Home today summary line (pages + minutes)

### Deliverables

- Working daily goal with progress
- Accurate streak calculation
- Stats screen populated from real data

### Verify

```
✓ Set goal 5 pages — read 5 — goal marked complete
✓ Read today + yesterday — streak = 2
✓ Skip a day — streak resets; recovery message shown
✓ Stats show correct today and weekly numbers
✓ Mark book finished — finished count increments
```

### Suggested Cursor Prompt

> "Implement Phase 5 from docs/DEVELOPMENT_ROADMAP.md. Add daily goals, streak system, and stats per docs/FEATURES.md sections D, E, and I. Follow non-guilt UX from docs/USER_FLOWS.md."

---

## Phase 6: Rescue Mode, Bookmarks & Notes

**Goal:** Reader's block features and page-level annotations.

### Tasks

- [ ] Implement `BookmarkRepository` and bookmark service/hook
- [ ] Bookmark button in reader → save with optional title
- [ ] Bookmark list per book → jump to page
- [ ] Delete bookmark
- [ ] Implement `NoteRepository` and note service/hook
- [ ] Note button in reader → add note modal
- [ ] Notes list per book → view, edit, delete
- [ ] Rescue modal on Home with 6 options
- [ ] "Read 1 page" rescue flow with overlay
- [ ] "Read 3 minutes" rescue with countdown overlay
- [ ] "Write why I'm stuck" journal → save to settings
- [ ] "No-pressure session" flow
- [ ] Rescue shortcut when 3+ days inactive on current book

### Deliverables

- Full Rescue Mode per spec
- Bookmarks and notes working
- **MVP feature-complete**

### Verify

```
✓ Add bookmark on page 30 → list shows it → tap → jumps to 30
✓ Add note on page 30 → edit → delete
✓ Rescue "Read 1 page" → session saved with 1 page
✓ Rescue "3 minutes" → timer runs → session saved
✓ Blocker journal saves text to settings
✓ All MVP acceptance criteria from PRODUCT_REQUIREMENTS.md pass
```

### Suggested Cursor Prompt

> "Implement Phase 6 from docs/DEVELOPMENT_ROADMAP.md. Add Reader's Block Rescue Mode, bookmarks, and notes per docs/FEATURES.md sections F, G, H."

---

## Phase 7: Cloudinary Backup (Optional)

**Goal:** Optional secure PDF backup and restore.

### Tasks

- [ ] Create `backend/` Express project
- [ ] Implement sign-upload, sign-download, delete routes
- [ ] Deploy backend; add URL to app settings
- [ ] Implement `CloudinaryService` in mobile app
- [ ] Settings: cloud backup toggle
- [ ] Auto-upload after import (when enabled)
- [ ] Detect missing local file → offer restore
- [ ] Restore flow: download → save local → open
- [ ] Delete remote on book delete (when uploaded)
- [ ] Retry failed uploads

### Deliverables

- Optional backup without affecting offline reading
- Restore works after local file loss

### Verify

```
✓ Enable backup → import PDF → is_uploaded = 1
✓ Delete local file manually → open book → restore succeeds
✓ Disable backup → import → no upload
✓ Delete book → remote asset removed
✓ App reads only from local file during normal use
```

### Suggested Cursor Prompt

> "Implement Phase 7 from docs/DEVELOPMENT_ROADMAP.md and docs/CLOUDINARY_BACKUP.md. Add minimal Express backend and CloudinaryService for optional backup."

---

## Engineering Rules (All Phases)

1. **TypeScript strictly** — enable `strict` in tsconfig; no `any`
2. **Business logic outside UI** — screens → hooks → services → repositories
3. **Do not store PDFs in SQLite** — files in `documentDirectory/pdfs/`
4. **Do not expose Cloudinary secrets in mobile app**
5. **Keep MVP simple** — only build what the current phase requires
6. **Prefer local-first** — every feature must work offline (except Phase 7 restore)
7. **Avoid unnecessary packages** — justify each new dependency
8. **Clear naming** — match service/repository names in Architecture doc
9. **Maintainable code** — small files; one responsibility per module
10. **Comments only where useful** — e.g. streak grace period logic
11. **Build incrementally** — pass phase verification before proceeding

---

## Dependency Installation Schedule

| Phase | Packages |
|-------|----------|
| 1 | `expo-router`, `expo-sqlite`, `expo-file-system`, `expo-crypto` |
| 2 | `expo-document-picker` |
| 3 | `react-native-pdf` (or chosen viewer) — may need `expo-dev-client` |
| 4 | — (use React `AppState` only) |
| 5 | — |
| 6 | — |
| 7 | `backend`: `express`, `cloudinary`, `dotenv`, `cors` |

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| PDF viewer incompatible with Expo Go | Plan for dev client build in Phase 3 |
| Large PDFs slow to copy on import | Show progress indicator; copy is async |
| `total_pages` not available until render | Update on first PDF load callback |
| Streak timezone edge cases | Use device local timezone consistently in `date.ts` utils |
| SQLite migration on schema change | Version migrations; never edit applied ones |

---

## Definition of Done (Full MVP)

After Phase 6, the project is MVP-complete when all items in [Product Requirements — MVP Acceptance Criteria](PRODUCT_REQUIREMENTS.md#mvp-acceptance-criteria) are satisfied and the app runs fully offline without any backend.

---

## Post-MVP Ideas (Not Planned)

- Push notification reading reminders
- PDF text search
- Reading heatmap calendar
- Export stats to CSV
- Multiple notes per page with tags
- Cover image extraction from PDF
- Widget for "Continue Reading"

Do not implement these unless explicitly requested.
