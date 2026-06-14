# User Flows & UI Specification

Step-by-step flows, screen layouts, and UX principles.

---

## UI/UX Principles

### How the App Should Feel

| Quality | Implementation |
|---------|----------------|
| **Calm** | Soft colors, generous whitespace, no notification badges |
| **Minimal** | One primary action per screen; hide secondary actions |
| **Reading-focused** | Reader screen is distraction-free; stats are secondary |
| **Not noisy** | No popups on every session; no daily nagging |
| **Not guilt-based** | Never shame for missed days |
| **Encouraging** | Recovery messages invite small wins |

### Language Guidelines

| Situation | Good | Bad |
|-----------|------|-----|
| Missed yesterday | "You missed yesterday. Read 1 page today to restart." | "You failed your goal." |
| Streak broken | "Your streak paused. Pick any book and read a little." | "Streak lost! Start over." |
| Low progress | "3 pages today — small steps count." | "Only 3 pages? You can do better." |
| Goal complete | "Today's goal reached." | "AMAZING! You're crushing it!!!" |
| No books yet | "Import a PDF to start reading." | "Your library is empty. Get reading!" |

### Visual Tone

- Neutral backgrounds (off-white or soft dark gray)
- Accent color for progress (muted green or blue — not aggressive red/gold)
- Typography: readable sans-serif; comfortable line height in reader chrome
- Icons: simple line icons; no gamification trophies in MVP

---

## Navigation Structure

```
Tab Navigator (bottom)
├── Home        (index.tsx)
├── Library     (library.tsx)
├── Stats       (stats.tsx)
└── Settings    (settings.tsx)

Stack (modal or push)
└── Reader      (reader/[bookId].tsx)
```

Reader is a full-screen stack route — hides tab bar for immersion.

---

## Screen Specifications

### Home Screen (`app/index.tsx`)

**Purpose:** Daily dashboard — what to read now and how today is going.

**Layout (top to bottom):**

```
┌─────────────────────────────────┐
│  Good morning / evening         │
├─────────────────────────────────┤
│  TODAY'S GOAL                   │
│  ████████░░  8 / 10 pages       │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │  Continue Reading       │    │
│  │  "Book Title"           │    │
│  │  Page 42 of 340         │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  🔥 Streak: 5 days              │
├─────────────────────────────────┤
│  Reader's Block Rescue          │
│  [Need a small push?]           │
├─────────────────────────────────┤
│  Today: 8 pages · 24 min        │
└─────────────────────────────────┘
```

**Elements:**

| Element | Data Source | Action |
|---------|-------------|--------|
| Today's goal progress | `GoalService` | Tap → Settings (goal config) |
| Continue Reading CTA | `BookService.getContinueReadingBook()` | → Reader |
| Current streak | `StreakService` | Tap → Stats |
| Rescue shortcut | — | → Rescue modal |
| Today summary | `StatsService.getTodayStats()` | Tap → Stats |

**Empty state:** No books → "Import your first PDF" → Library

---

### Library Screen (`app/library.tsx`)

**Purpose:** Manage all imported PDFs.

**Layout:**

```
┌─────────────────────────────────┐
│  Library          [+ Add PDF]   │
├─────────────────────────────────┤
│  Filter: All | Reading | Done   │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │ Book Title              │    │
│  │ 24% · Reading · Page 82 │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ Another Book            │    │
│  │ 0% · Not Started        │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Actions:**

| Action | Result |
|--------|--------|
| Tap book row | Open Reader |
| Long press / menu | Rename, Delete, Mark Finished |
| + Add PDF | Document picker → import flow |
| Filter chips | Filter list by status |

---

### Reader Screen (`app/reader/[bookId].tsx`)

**Purpose:** Read PDF with session tracking.

**Layout:**

```
┌─────────────────────────────────┐
│  ← Book Title        12:34 ⏱    │
├─────────────────────────────────┤
│                                 │
│                                 │
│         PDF VIEWER              │
│                                 │
│                                 │
├─────────────────────────────────┤
│  ◀   Page 42 / 340   ▶   🔖 📝  │
│              [Finish Session]   │
└─────────────────────────────────┘
```

**Elements:**

| Element | Behavior |
|---------|----------|
| Back arrow | Confirm if session > 30s; save session |
| Timer | Elapsed active reading time |
| PDF viewer | Swipe/scroll pages |
| Page indicator | Tap → jump to page modal |
| Prev/Next | Page navigation |
| 🔖 Bookmark | Add bookmark for current page |
| 📝 Note | Add/view note for current page |
| Finish Session | End session + optional survey |

**Auto-behaviors:**
- Resume at `current_page` on mount
- Start timer on mount
- Pause timer on `AppState` background
- Auto-save page on change (debounced)

---

### Stats Screen (`app/stats.tsx`)

**Purpose:** Simple reading analytics.

**Layout:**

```
┌─────────────────────────────────┐
│  Stats                          │
├─────────────────────────────────┤
│  TODAY                          │
│  12 pages  ·  35 minutes        │
├─────────────────────────────────┤
│  THIS WEEK                      │
│  48 pages  ·  4 reading days    │
├─────────────────────────────────┤
│  STREAK                         │
│  Current: 5  ·  Longest: 12     │
├─────────────────────────────────┤
│  FINISHED BOOKS                 │
│  3 books completed              │
└─────────────────────────────────┘
```

No charts in MVP — numbers and labels only.

---

### Settings Screen (`app/settings.tsx`)

**Purpose:** App preferences.

**Sections:**

| Section | Options |
|---------|---------|
| **Daily Goal** | Type: pages / minutes; Target number |
| **Reading** | Default timer (optional, minutes) |
| **Backup** | Cloud backup toggle (Phase 7); Backend URL |
| **Appearance** | Theme: light / dark / system |
| **Data** | Reset all data (with confirmation) |
| **About** | App version |

---

## User Flows

### Flow 1: Import PDF

```
1. User opens Library screen
2. Taps "+ Add PDF"
3. Native document picker opens (PDF filter)
4. User selects a PDF file
5. App generates bookId (UUID)
6. PdfFileService copies file to documentDirectory/pdfs/{bookId}.pdf
7. BookService creates book record:
   - title = filename without extension
   - local_uri, file_name, file_size
   - status = 'not_started'
   - current_page = 1
8. Library list refreshes; new book appears at top
9. (Phase 7) If cloud backup enabled → background upload to Cloudinary

Success: Book visible in library
Cancel: Picker dismissed → no changes
Error: Copy failed → toast "Could not import file"
```

---

### Flow 2: Continue Reading

```
1. User opens Home screen
2. Sees "Continue Reading" card with last active book
3. Taps card
4. App navigates to /reader/[bookId]
5. PdfFileService verifies local file exists
6. Reader loads PDF at books.current_page
7. ReadingSessionService.startSession(bookId, currentPage)
8. Timer starts
9. User reads...

Alternate entry: Library → tap book row → same steps 4–9
```

---

### Flow 3: Finish Reading Session

```
1. User is in Reader screen (session active)
2. User taps "Finish Session"
3. Optional modal appears:
   - Focus level (1–5, skippable)
   - Mood (skippable)
   - Blocker reason (skippable)
4. User confirms or skips
5. ReadingSessionService.finishSession():
   - end_page = current page
   - pages_read = end - start
   - duration_seconds = timer elapsed
   - Save to reading_sessions
6. BookService.updateProgress(bookId, endPage)
7. GoalService recalculates today's progress
8. StreakService recalculates if needed
9. Summary toast: "You read 5 pages in 18 minutes"
10. User returns to Home or Library

Alternate exit: Back button with active session
  → If duration > 30s: "Save this session?" → Yes = same as finish / No = discard
```

---

### Flow 4: Reader's Block Rescue

```
1. User feels stuck; taps "Reader's Block Rescue" on Home
2. Rescue modal opens with options:
   ┌─────────────────────────────────┐
   │  Pick a small step:             │
   │  [ Read 1 page ]                │
   │  [ Read 1 paragraph ]           │
   │  [ Read for 3 minutes ]         │
   │  [ Continue last book ]         │
   │  [ Write why I'm stuck ]        │
   │  [ No-pressure session ]        │
   └─────────────────────────────────┘
3a. "Read 1 page":
    → Open last book at current_page
    → Show calm overlay: "Just one page. That's enough."
    → On next page turn: auto-finish session with 1 page
3b. "Read 1 paragraph":
    → Open book with tip overlay (dismissible)
    → Normal session; no auto-end
3c. "Read for 3 minutes":
    → Open book with 3:00 countdown overlay
    → Session ends when timer hits 0 or user exits
3d. "Continue last book":
    → Same as Flow 2
3e. "Write why I'm stuck":
    → Text input modal → save to settings (last_blocker_note)
    → Optional: then offer "Read 1 page?" 
3f. "No-pressure session":
    → Open reader; timer runs; no minimum; mood optional on exit

4. Any qualifying activity counts toward reading day
5. Home screen updates streak/progress encouragingly
```

---

### Flow 5: Add Bookmark

```
1. User is reading in Reader screen
2. Taps bookmark icon (🔖)
3. Optional: prompt for bookmark title (default "Page N")
4. BookmarkService saves:
   - book_id, page_number, title, created_at
5. Brief confirmation: "Bookmarked page 42"
6. User continues reading

View bookmarks:
  Library → book menu → Bookmarks
  OR Reader → bookmarks list sheet → tap → jump to page
```

---

### Flow 6: Add Note

```
1. User is reading in Reader screen
2. Taps note icon (📝)
3. Modal opens with:
   - Page number (pre-filled, read-only)
   - Text input for note
4. User types note and saves
5. NoteService creates note record
6. User continues reading

View/edit notes:
  Library → book detail → Notes list
  → Tap note → edit or delete
```

---

### Flow 7: Complete Daily Goal

```
1. User has active daily goal (e.g. 10 pages)
2. User reads; sessions accumulate pages_read
3. Home screen progress bar updates live (on focus)
4. When sum(today pages_read) >= target:
   - GoalService.isTodayGoalComplete() = true
   - Home shows subtle "Today's goal reached"
   - No blocking modal; user can keep reading
5. Streak counts if today qualifies as reading day

Minutes goal variant:
  - Progress = sum(duration_seconds) / 60
  - Same completion logic
```

---

### Flow 8: Restore PDF from Cloudinary (Phase 7)

```
1. User taps book in Library (or Continue Reading)
2. PdfFileService.fileExists(local_uri) → false
3. App checks books.cloudinary_public_id
4. If null:
   → Show "PDF file missing. Please re-import."
   → Offer remove from library
5. If public_id exists:
   → Show "Restoring from backup..."
   → CloudinaryService.restorePdf(bookId):
     a. POST backend /sign-download
     b. Download PDF from signed URL
     c. Save to documentDirectory/pdfs/{bookId}.pdf
     d. Update local_uri, is_downloaded = 1
   → Open reader with local file
6. On restore failure:
   → "Could not restore. Check connection or re-import."
```

---

## Modal & Overlay Inventory

| Modal | Trigger | Phase |
|-------|---------|-------|
| Import confirmation | After pick (optional) | 2 |
| Delete book confirm | Library delete | 2 |
| Rename book | Library long press | 2 |
| Jump to page | Reader page indicator tap | 3 |
| Finish session survey | Finish Session button | 4 |
| Session save confirm | Back with active session | 4 |
| Rescue options | Home rescue button | 6 |
| Blocker journal | Rescue option | 6 |
| Bookmark title | Bookmark button | 6 |
| Note editor | Note button | 6 |
| Reset data confirm | Settings | 1 |

---

## Accessibility Notes (MVP Baseline)

- Minimum touch target 44×44 pt
- Screen reader labels on all icon buttons
- Sufficient contrast for text on backgrounds
- Support system font scaling

---

## States to Design For

| State | Screen | Treatment |
|-------|--------|-----------|
| Loading | All | Simple spinner or skeleton |
| Empty library | Library | CTA to import |
| No active book | Home | Hide continue card; show import CTA |
| File missing | Reader | Error message + re-import (or restore Phase 7) |
| Goal not set | Home | "Set a daily goal" link to Settings |
| First launch | Home | Brief welcome; no forced onboarding |
