# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (Expo)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  UI Layer   │→ │ Feature Layer│→ │   Service Layer    │  │
│  │ (Screens &  │  │ (Hooks &     │  │ (Business Logic)   │  │
│  │ Components) │  │  Coordinators)│  │                    │  │
│  └─────────────┘  └──────────────┘  └──────────┬──────────┘  │
│                                                   │            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Repository / Data Layer                    │  │
│  │  ┌──────────────────┐    ┌──────────────────────────┐ │  │
│  │  │ SQLite (metadata)│    │ Local File Storage (PDFs) │ │  │
│  │  └──────────────────┘    └──────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Optional (Phase 7)
                               ▼
              ┌────────────────────────────────┐
              │   Minimal Backend API (Express) │
              │   Signed Cloudinary URLs only   │
              └────────────────┬───────────────┘
                               ▼
              ┌────────────────────────────────┐
              │      Cloudinary Storage         │
              │   (Optional PDF backup)         │
              └────────────────────────────────┘
```

---

## Layer Responsibilities

### UI Layer
- Expo Router screens (`app/`)
- Presentational components (`src/components/`)
- Receives data from hooks; dispatches user actions
- **No business logic** — no direct SQLite or file system calls
- Handles loading, empty, and error states

### Feature Layer
- Feature-specific hooks and coordinators (`src/features/*/`)
- Combines multiple services for screen-level operations
- Examples: `useLibrary`, `useReader`, `useRescueMode`, `useTodayStats`
- Manages local UI state (modals, form inputs)

### Service Layer
- Pure business logic (`src/services/`)
- Orchestrates repositories and external APIs
- Examples: `BookService`, `ReadingSessionService`, `StreakService`
- Testable without React components

### Repository / Data Layer
- Data access abstraction (`src/db/`, `src/storage/`)
- Repositories: `BookRepository`, `SessionRepository`, etc.
- SQLite queries and file I/O isolated here
- Returns typed domain objects

### Local SQLite Database
- Metadata, sessions, bookmarks, notes, goals, settings
- **Never stores PDF binary data**

### Local File Storage
- Actual PDF files at `{documentDirectory}/pdfs/{bookId}.pdf`
- Fast offline reading source of truth

### Optional Backend API
- Minimal Express server for Cloudinary signed URLs only
- No user authentication in MVP
- Deploy separately (Railway, Render, Fly.io, etc.)

### Optional Cloudinary Storage
- Backup copy of PDFs
- Not required for daily reading
- Restore only when local file is missing

---

## Key Architectural Rules

1. **PDFs are files, not database blobs.** SQLite stores `local_uri`, not file content.
2. **Local-first reads.** Always read PDF from local storage; Cloudinary is backup only.
3. **Services own business rules.** Streak calculation, goal progress, pages read — all in services.
4. **Repositories own queries.** No raw SQL in components or services (services call repositories).
5. **Single direction of dependency:** UI → Features → Services → Repositories → DB/Storage.
6. **Optional backend is stateless.** No user DB on server; only signs Cloudinary requests.

---

## Folder Structure

```
Read_Book/
├── app/                          # Expo Router — screens only
│   ├── _layout.tsx               # Root layout, providers, DB init
│   ├── index.tsx                 # Home screen
│   ├── library.tsx               # PDF library
│   ├── stats.tsx                 # Stats dashboard
│   ├── settings.tsx              # App settings
│   └── reader/
│       └── [bookId].tsx          # PDF reader (dynamic route)
│
├── src/
│   ├── components/               # Shared UI components
│   │   ├── ui/                   # Buttons, cards, inputs, modals
│   │   ├── library/              # BookListItem, ImportButton, etc.
│   │   ├── reader/               # PageIndicator, ReaderToolbar, Timer
│   │   ├── stats/                # StatCard, StreakBadge
│   │   └── rescue/               # RescueOptionCard, RescueModal
│   │
│   ├── features/                 # Feature modules (hooks + screen logic)
│   │   ├── books/                # useBooks, useBookDetail, import flow
│   │   ├── pdf/                  # usePdfReader, page navigation
│   │   ├── sessions/             # useReadingSession, session timer
│   │   ├── goals/                # useDailyGoal, goal progress
│   │   ├── streaks/              # useStreak, recovery messages
│   │   ├── stats/                # useTodayStats, useWeeklyStats
│   │   ├── bookmarks/            # useBookmarks
│   │   └── notes/                # useNotes
│   │
│   ├── db/                       # Database layer
│   │   ├── database.ts           # SQLite connection, migrations
│   │   ├── migrations/           # Versioned schema migrations
│   │   └── repositories/         # BookRepository, SessionRepository, etc.
│   │
│   ├── storage/                  # File system layer
│   │   └── pdfStorage.ts         # PDF copy, delete, exists checks
│   │
│   ├── hooks/                    # Cross-cutting hooks
│   │   ├── useAppState.ts        # Foreground/background detection
│   │   └── useDatabase.ts        # DB ready state
│   │
│   ├── utils/                    # Pure utilities
│   │   ├── date.ts               # Timezone-safe date helpers
│   │   ├── format.ts             # Duration, page formatting
│   │   └── ids.ts                # UUID generation
│   │
│   ├── services/                 # Business logic services
│   │   ├── BookService.ts
│   │   ├── PdfFileService.ts
│   │   ├── ReadingSessionService.ts
│   │   ├── GoalService.ts
│   │   ├── StreakService.ts
│   │   ├── StatsService.ts
│   │   └── CloudinaryService.ts  # Phase 7
│   │
│   └── types/                    # Shared TypeScript types
│       ├── book.ts
│       ├── session.ts
│       └── settings.ts
│
├── backend/                      # Optional — Phase 7
│   ├── src/
│   │   ├── index.ts              # Express entry
│   │   ├── routes/
│   │   │   └── cloudinary.ts     # Sign upload/download
│   │   └── services/
│   │       └── cloudinarySign.ts
│   ├── package.json
│   └── .env.example
│
├── docs/                         # Project documentation
├── assets/                       # App icons, splash
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

### Folder Responsibilities

| Folder | Responsibility |
|--------|----------------|
| `app/` | Route-based screens; thin wrappers that compose features and components |
| `src/components/` | Reusable, mostly stateless UI building blocks |
| `src/features/` | Feature-specific hooks tying services to UI needs |
| `src/db/` | SQLite init, migrations, repository pattern data access |
| `src/storage/` | Local PDF file operations (copy, delete, path resolution) |
| `src/hooks/` | App-wide hooks not tied to one feature |
| `src/utils/` | Pure functions with no side effects |
| `src/services/` | Business rules and orchestration |
| `src/types/` | Shared interfaces and enums |
| `backend/` | Optional minimal API for Cloudinary signing (Phase 7) |

---

## Service Layer Design

### BookService

| Method | Description |
|--------|-------------|
| `createFromImport(pickedFile)` | Copy PDF to storage, insert book row, return Book |
| `updateProgress(bookId, currentPage, totalPages?)` | Update `current_page`, optionally `total_pages` |
| `updateTitle(bookId, title)` | Rename display title |
| `updateStatus(bookId, status)` | Set not_started / reading / paused / finished |
| `markAsFinished(bookId)` | Set status finished, current_page = total_pages |
| `deleteBook(bookId)` | Delete file, cascade DB records |
| `getAll()` | List all books |
| `getById(bookId)` | Single book with computed progress |
| `getContinueReadingBook()` | Most recent incomplete book for Home CTA |

### PdfFileService

| Method | Description |
|--------|-------------|
| `pickPdf()` | Open document picker; return picked asset or null |
| `copyToAppStorage(sourceUri, bookId)` | Copy to `pdfs/{bookId}.pdf`; return local URI |
| `fileExists(localUri)` | Check if PDF file still on disk |
| `deleteLocalPdf(bookId)` | Remove PDF file from storage |
| `getLocalUri(bookId)` | Return expected path for book |
| `getFileSize(localUri)` | Return file size in bytes |

### ReadingSessionService

| Method | Description |
|--------|-------------|
| `startSession(bookId, startPage)` | Create in-memory session context |
| `finishSession(context, endPage, extras?)` | Persist session, update book, trigger goal/streak recalc |
| `calculateDuration(startTime, endTime, pausedMs)` | Return seconds |
| `calculatePagesRead(startPage, endPage)` | Return non-negative page delta |
| `getSessionsForBook(bookId)` | History for a book |
| `getSessionsForDate(date)` | All sessions on a given day |

### GoalService

| Method | Description |
|--------|-------------|
| `getActiveGoal()` | Current active daily goal or null |
| `setDailyGoal(type, targetValue)` | Deactivate old, create new active goal |
| `getTodayProgress()` | `{ pages, minutes }` from today's sessions |
| `isTodayGoalComplete()` | Compare progress vs active goal |
| `getGoalProgressPercent()` | 0–100 for progress bar |

### StreakService

| Method | Description |
|--------|-------------|
| `calculateCurrentStreak()` | Consecutive reading days to today/yesterday |
| `calculateLongestStreak()` | Historical max |
| `getReadingDaysInRange(start, end)` | Dates that qualify as reading days |
| `detectMissedDays()` | Days since last reading day |
| `getRecoveryMessage()` | Encouraging, non-guilt message based on context |

### StatsService

| Method | Description |
|--------|-------------|
| `getTodayStats()` | Pages, minutes today |
| `getWeeklyStats()` | Pages, reading days this week |
| `getBookProgressStats(bookId)` | Sessions count, total pages read, total time |
| `getFinishedBooksCount()` | Count of finished books |

### CloudinaryService (Phase 7 — Optional)

| Method | Description |
|--------|-------------|
| `uploadPdf(bookId)` | Request signed URL → upload → save public_id |
| `restorePdf(bookId)` | Request signed download → save locally |
| `deleteRemotePdf(publicId)` | Remove from Cloudinary |
| `isBackupEnabled()` | Read settings toggle |

---

## Data Flow Examples

### Import PDF
```
UI (library.tsx)
  → useImportBook (feature)
    → PdfFileService.pickPdf()
    → PdfFileService.copyToAppStorage()
    → BookService.createFromImport()
      → BookRepository.insert()
```

### Finish Session
```
UI (reader/[bookId].tsx)
  → useReadingSession.finish()
    → ReadingSessionService.finishSession()
      → SessionRepository.insert()
      → BookService.updateProgress()
      → GoalService (recalculate)
      → StreakService (recalculate)
```

---

## Technology Choices

| Need | Package (suggested) | Notes |
|------|---------------------|-------|
| SQLite | `expo-sqlite` | Official Expo module |
| File system | `expo-file-system` | documentDirectory for PDFs |
| Document picker | `expo-document-picker` | PDF mime filter |
| PDF viewer | `react-native-pdf` | May need dev build; evaluate `expo` compatibility |
| UUID | `expo-crypto` or `uuid` | For book/session IDs |
| Navigation | `expo-router` | File-based routing |

> Evaluate PDF viewer package at Phase 3 — some require native modules and Expo dev client.

---

## Engineering Rules

1. **TypeScript strictly** — no `any`; define interfaces for all DB rows and service returns.
2. **Business logic outside UI** — screens call hooks; hooks call services.
3. **Services and repositories** — never skip layers for convenience.
4. **Do not store PDFs in SQLite** — files only in `documentDirectory/pdfs/`.
5. **Do not expose Cloudinary secrets in mobile app** — backend signs URLs only.
6. **Keep MVP simple** — implement exactly what docs specify; defer extras.
7. **Prefer local-first** — offline must work without network.
8. **Avoid unnecessary packages** — justify each dependency.
9. **Clear naming** — `BookService`, not `BS`; `createFromImport`, not `doImport`.
10. **Maintainable code** — small files, single responsibility.
11. **Comments only where useful** — explain non-obvious business rules (e.g. streak grace).
12. **Build incrementally** — complete each roadmap phase before starting the next.
