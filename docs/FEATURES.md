# Core Features

Detailed specifications for each MVP feature. Use this document when implementing individual modules.

---

## A. PDF Library

### Purpose
Central place to manage all imported PDF books.

### Features

#### Import PDF
- User taps "Add PDF" on Library screen
- System opens native document picker (PDF mime type only)
- On selection: copy file to app storage, create book record in SQLite
- Show success feedback; book appears in library list
- **Edge case:** If picker cancelled, do nothing
- **Edge case:** If file copy fails, show error; do not create DB record

#### Save File Locally
- Handled by `PdfFileService` — see Storage Strategy doc
- Path: `{documentDirectory}/pdfs/{bookId}.pdf`
- Original filename preserved in metadata (`file_name` field)

#### Show List of Imported PDFs
- Flat list sorted by `updated_at` descending (most recently touched first)
- Each row shows: title, author (if set), progress %, status badge, last read date
- Empty state: illustration + "Import your first PDF" CTA

#### Rename PDF Title
- Tap book → edit title inline or via modal
- Updates `books.title` and `books.updated_at`
- Does not rename the physical file (file stays `{bookId}.pdf`)

#### Delete PDF
- Confirmation dialog: "Delete [title]? This removes the book and all sessions, bookmarks, and notes."
- Deletes: local PDF file, book record, related sessions/bookmarks/notes (cascade)
- Optional (Phase 7): prompt to delete Cloudinary copy if `cloudinary_public_id` exists

#### Show Reading Progress
- Progress = `current_page / total_pages * 100` (rounded)
- Display as percentage and "Page X of Y"
- If `total_pages` unknown, show "Page X" only until first full read session establishes count

#### Show Status
| Status | Condition |
|--------|-----------|
| `not_started` | `current_page` is 0 or null; no sessions |
| `reading` | Has sessions; `current_page < total_pages` |
| `paused` | User manually set paused OR no session in 14+ days while incomplete |
| `finished` | `current_page >= total_pages` OR user marked finished |

Status is derived or stored on `books.status` — update on session end and manual actions.

---

## B. PDF Reader

### Purpose
In-app PDF viewing with automatic progress and session tracking.

### Features

#### Open Selected PDF
- Navigate to `/reader/[bookId]`
- Load PDF from `books.local_uri`
- If file missing: show restore prompt (Phase 7) or error in MVP

#### Page Display
- Show current page number and total pages in header/footer bar
- Example: `12 / 340`

#### Navigate Pages
- Swipe left/right (if PDF library supports)
- Previous / Next buttons
- Jump to page: tap page indicator → number input modal

#### Save Current Page Automatically
- On page change: debounce 500ms, then update `books.current_page`
- On app background: save immediately
- On reader unmount: save immediately

#### Resume from Last Page
- On open: navigate to `books.current_page` (default 1 if 0/null)
- No "where did you leave off?" prompt — just open there

#### Reading Timer
- **Auto-start** when reader screen mounts
- **Pause** when app goes to background (`AppState` change)
- **Resume** when app returns to foreground
- Display elapsed time in reader UI (e.g. `12:34`)
- Timer state held in memory; final duration saved on session end

#### Save Session on Exit
- Triggered when:
  - User taps "Finish Session"
  - User navigates back from reader (confirm if session > 30 seconds)
- Creates `reading_sessions` record with start/end pages and duration

---

## C. Reading Session Tracker

### Purpose
Record discrete reading periods for stats, goals, and streak calculation.

### Session Lifecycle

```
Reader opens → session starts (in-memory)
  → user reads (pages tracked)
  → user finishes or exits → session saved to SQLite
```

### Data Captured

| Field | Source |
|-------|--------|
| `book_id` | Current book |
| `start_page` | Page when session started |
| `end_page` | Page when session ended |
| `pages_read` | `max(0, end_page - start_page)` |
| `duration_seconds` | Timer elapsed (excluding background time) |
| `focus_level` | Optional 1–5 scale (asked on finish) |
| `mood` | Optional enum: calm, tired, motivated, distracted, stuck |
| `blocker_reason` | Optional free text if user reports being blocked |

### Finish Session Flow
1. User taps "Finish Session"
2. Optional quick survey modal (focus, mood, blocker — all skippable)
3. Save session to DB
4. Update book `current_page`, `status`, `updated_at`
5. Recalculate today's goal progress and streak
6. Show brief summary: "You read X pages in Y minutes"

### Pages Read Calculation
```typescript
pages_read = Math.max(0, end_page - start_page);
```
- If user only re-read same page: `pages_read = 0` (still counts time toward minute goals)

---

## D. Daily Goal System

### Purpose
Give a clear daily target without pressure.

### Goal Types

| Type | `goal_type` value | Target field |
|------|-------------------|--------------|
| Pages per day | `pages` | `target_value` = number of pages |
| Minutes per day | `minutes` | `target_value` = number of minutes |

- Only one active goal at a time (`is_active = 1`)
- Changing goal type deactivates previous goal and creates new active row

### Today's Progress

Calculated from `reading_sessions` where `created_at` is today (local timezone):

| Goal type | Progress calculation |
|-----------|---------------------|
| `pages` | Sum of `pages_read` for today |
| `minutes` | Sum of `duration_seconds` for today ÷ 60 |

### Goal Completion
- When progress >= target: mark day as goal-completed (store in settings or derive)
- UI: subtle checkmark or "Goal reached" message — not confetti or guilt if missed
- Missing goal yesterday does not block today's progress display

---

## E. Streak System

### Purpose
Track consistency with encouragement, not punishment.

### Definitions

| Metric | Rule |
|--------|------|
| **Reading day** | Any day with at least one `reading_sessions` record where `pages_read >= 1` OR `duration_seconds >= 180` (3 min) |
| **Current streak** | Consecutive reading days ending today or yesterday |
| **Longest streak** | Max consecutive reading days in history |

### Reading Day Detection
```sql
-- A day counts if sum(pages_read) >= 1 OR sum(duration_seconds) >= 180
```

### Missed Day Recovery
- If streak broken: show recovery message, not failure message
- **Good:** "You missed yesterday. Read 1 page today to restart."
- **Bad:** "You failed your goal." / "Streak lost!"
- Offer Rescue Mode shortcut from streak widget when streak is 0

### UI Principles
- Show current streak prominently on Home
- Show longest streak on Stats (secondary)
- Never use red/warning colors for missed days
- Gray or neutral tone for "no reading yesterday"

---

## F. Reader's Block Rescue Mode

### Purpose
**Key differentiator.** Help restart reading when motivation is low.

### Entry Points
- Home screen "Rescue" button/card
- Prompt after 3+ days without a session on current book
- Optional: from Stats when weekly reading days = 0

### Rescue Options

| Option | Behavior |
|--------|----------|
| **Read 1 page** | Open last/current book → jump to `current_page` → show overlay "Just read this one page" → auto-end session after 1 page turn |
| **Read 1 paragraph** | Open book → show tip "Scroll to the next paragraph break and stop" → no strict tracking; session ends on exit |
| **Read for 3 minutes** | Open book → start 3-minute countdown timer overlay → session ends when timer completes or user exits |
| **Continue last book** | Open most recently updated incomplete book at `current_page` |
| **Write why I'm stuck** | Free-text journal entry saved to settings or a `blocker_notes` log (store as settings key `last_blocker_note` + timestamp) |
| **Start no-pressure session** | Open reader without goal overlay; timer runs but no page minimum; optional mood capture on exit only |

### UX Rules
- No countdown pressure before starting
- Large, calm buttons
- Dismiss anytime without penalty
- Completing any rescue option counts toward reading day (if criteria met)

---

## G. Bookmarks

### Purpose
Save important pages for quick return.

### Features

| Action | Behavior |
|--------|----------|
| **Bookmark current page** | Tap bookmark icon in reader → optional title prompt → save to `bookmarks` |
| **List by PDF** | Book detail or reader sidebar → list bookmarks sorted by `page_number` |
| **Jump to bookmark** | Tap bookmark row → navigate reader to `page_number` |
| **Delete bookmark** | Swipe or long-press → confirm → delete row |

### Defaults
- Default bookmark title: `"Page {page_number}"` if user skips title entry

---

## H. Notes

### Purpose
Capture thoughts tied to a specific page.

### Features

| Action | Behavior |
|--------|----------|
| **Add note** | Tap note icon in reader → modal with page number pre-filled → save |
| **View by book** | Book detail screen → Notes tab/list |
| **Edit note** | Tap note → edit modal → update `note_text` and `updated_at` |
| **Delete note** | Swipe or delete button → confirm |

### Constraints (MVP)
- One note per page per book (editing overwrites); OR allow multiple — **decision: allow multiple notes per page** for flexibility
- Plain text only; no rich text or markdown

---

## I. Stats

### MVP Stats

| Stat | Calculation |
|------|-------------|
| Pages read today | `SUM(pages_read)` for today's sessions |
| Minutes read today | `SUM(duration_seconds) / 60` for today |
| Pages read this week | `SUM(pages_read)` for current calendar week (Mon–Sun) |
| Reading days this week | Count distinct days with qualifying sessions this week |
| Current streak | From StreakService |
| Books/PDFs finished | `COUNT(books)` where `status = 'finished'` |

### Stats Screen Layout
- **Today card:** pages + minutes
- **This week card:** pages + reading days
- **Streak card:** current + longest
- **Finished books:** count + optional list

### Not in MVP Stats
- Monthly/yearly charts
- Reading heatmap
- Average session length trends
- Export to CSV
