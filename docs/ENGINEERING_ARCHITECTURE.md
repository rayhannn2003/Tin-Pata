# Engineering Architecture

Tin Pata (তিনপাতা) — technical architecture reference for **v1.4.0** and the path toward **v2 cloud sync**.

**Audience:** developers maintaining the app or planning v2.  
**Scope:** documentation only — describes what exists today, not a redesign.

**Related docs:** [ARCHITECTURE.md](./ARCHITECTURE.md) (overview) · [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) · [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md) · [READER_KNOWN_LIMITATIONS.md](./READER_KNOWN_LIMITATIONS.md) · [STORAGE_STRATEGY.md](./STORAGE_STRATEGY.md)

---

## 1. High-level architecture

### Local-first by design

Tin Pata is an **offline-first, Android-first** personal reading app. All reading data lives on the device:

- **SQLite** — structured metadata (books, sessions, notes, bookmarks, goals, settings)
- **File system** — PDF bytes under the app document directory
- **JSON backup** — portable export/import via the system share sheet (no server)

There is **no backend**, **no account system**, and **no cloud library sync** in v1.4. Notifications are scheduled locally with `expo-notifications`.

```
┌─────────────────────────────────────────────────────────────┐
│                     Android device                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Expo Router │  │ Feature hooks │  │ react-native-pdf │  │
│  │   screens   │→ │  + components │→ │  (native build)  │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                │                    │             │
│         └────────────────┼────────────────────┘             │
│                          ▼                                  │
│                   ┌─────────────┐                             │
│                   │  Services   │  business rules, orchestration
│                   └──────┬──────┘                             │
│            ┌─────────────┼─────────────┐                      │
│            ▼             ▼             ▼                      │
│     ┌──────────┐  ┌──────────┐  ┌────────────┐             │
│     │Repositories│ │ pdfStorage│ │ Backup JSON│             │
│     │  (SQLite)  │  │ (files)  │  │  (cache)   │             │
│     └──────────┘  └──────────┘  └────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Why SQLite?

SQLite fits a single-user, relational, offline app:

| Need | SQLite answer |
|------|----------------|
| Structured queries | Books, sessions, notes with foreign keys (`book_id`) |
| Fast local reads | Stats, library filters, search without network |
| Migrations | Versioned schema upgrades (`schema_migrations` table) |
| Transactions | Backup replace/merge, reset-all in one atomic unit |
| Small footprint | No server process; `expo-sqlite` on device |

Repositories map SQL rows (snake_case) to TypeScript domain types (camelCase). All DB access goes through `withDatabase()` so concurrent calls are **serialized** — this prevents dev fast-refresh lock errors.

**Database file:** `reading-habit.db` (`src/db/database.native.ts`).

### Why PDFs are not in SQLite

PDF files can be **large** (tens to hundreds of MB). Storing blobs in SQLite would:

- Bloat the DB and slow backups
- Complicate memory use in the JS bridge
- Fight `react-native-pdf`, which expects a **file URI** or content URI

Instead:

- **Bytes** live at `{documentDirectory}/pdfs/{bookId}.pdf` (`src/storage/pdfStorage.ts`)
- **Metadata** lives in `books` (`local_uri`, `file_name`, `file_size`, `current_page`, etc.)

The reader resolves the canonical path via `PdfReaderService.resolveReaderUri()` — preferring `fileExistsForBook(bookId)` over a possibly stale `local_uri` after restore or relink.

### Application layers

Dependency direction is strict:

```
Screen (app/)  →  Feature hook (src/features/)  →  Service (src/services/)  →  Repository / File storage
```

| Layer | Responsibility | Must not |
|-------|----------------|----------|
| **Screen** | Layout, navigation, wire hooks to UI | Call repositories directly; embed business rules |
| **Feature hook** | Screen state, loading/errors, compose services | Import `expo-sqlite` or touch SQL |
| **Service** | Business logic, validation, orchestration | Know about React or navigation |
| **Repository** | CRUD SQL for one aggregate | Contain UI or backup JSON logic |
| **Storage** | PDF file I/O | Store session analytics |

**Example (reader open):**

`app/reader/[bookId].tsx` → `usePdfReader` → `BookService` / `ReaderPreferencesService` / `PdfReaderService` → `BookRepository` / `SettingsRepository` + `pdfStorage`.

**Root providers** (`app/_layout.tsx`): `DatabaseProvider` → `ThemeProvider` → `I18nProvider` → Expo Router `Stack`.

---

## 2. Module architecture

### Reader (`src/features/reader/`, `src/components/reader/`)

| Piece | Role |
|-------|------|
| `usePdfReader` | Prepare book, frozen fit/scroll, auto-resume, page save debounce |
| `useReaderPreferences` | Comfort toggles (timer, progress, brightness prefs) |
| `useReaderBrightness` | Apply/restore system brightness in reader |
| `PdfViewer.native.tsx` | `react-native-pdf` wrapper; frozen `page`, `fitPolicy`, `enablePaging` refs |
| `ReaderPdfContent` | Memoized shell; `key={pdfUri}` only |
| `ReaderStabilityService` | Documents/enforces `safe` stability mode constraints |
| `ReaderPreferencesService` | Read/write `reader_*` settings keys |

**Screens:** `app/reader/[bookId].tsx` (full-screen modal).

### Library (`src/features/books/`, `app/(tabs)/library.tsx`)

| Piece | Role |
|-------|------|
| `useLibrary` | Book list with annotation counts, import PDF, delete |
| `BookListItem` | Progress, category/priority badges, missing-PDF indicator |
| `libraryOrganize` utils | Client-side filter/sort (not persisted) |

Import flow: document picker → copy to `pdfs/{bookId}.pdf` → `BookRepository.createBook`.

### Books / book detail (`app/book/[bookId].tsx`)

| Piece | Role |
|-------|------|
| `useBook` | Single book record |
| `useBookStats` | Per-book analytics via `BookStatsService` |
| `BookService.relinkPdf` | Attach PDF to existing book after backup restore |
| `PdfAvailabilityService` | Runtime missing-PDF check |

### Notes (`src/features/notes/`, `app/notes/index.tsx`)

| Piece | Role |
|-------|------|
| `useBookNotes` / `usePageNotes` / `useAllNotes` | Scoped note lists |
| `NoteService` | CRUD |
| `NoteRepository` | `notes` table; search with book title join |

Notes are **per page per book** (`book_id`, `page_number`, `note_text`).

### Bookmarks (`src/features/bookmarks/`, `app/bookmarks/index.tsx`)

| Piece | Role |
|-------|------|
| `useBookmarks` / `useAllBookmarks` | Scoped bookmark lists |
| `BookmarkService` | CRUD |
| `BookmarkRepository` | Unique per `(book_id, page_number)` |

### Stats (`src/features/stats/`, `app/(tabs)/stats.tsx`)

| Piece | Role |
|-------|------|
| `useReadingStats` / `useTodayReadingSummary` | Session aggregates |
| `useWeeklyStats` | Week buckets |
| `useReadingInsights` | Mood/focus/blocker patterns via `ReadingInsightsService` |
| `ReadingActivityService` | Habit calendar data |

Goals and streaks are **derived from session rows** on read (`GoalService`, `StreakService`), not incremented imperatively on every page turn.

### Settings (`app/(tabs)/settings.tsx`, `src/components/settings/`)

| Area | Components / services |
|------|----------------------|
| Reading experience | `ReadingExperienceSettings`, `ReaderPreferencesService` |
| Language / theme | `LanguagePicker`, `ThemePicker`, `LanguageService`, `ThemeService` |
| Goals | `GoalEditor`, `GoalService` |
| Notifications | `NotificationSettingsPanel`, `NotificationService` |
| Backup | `DataBackupSection`, `BackupHealthCard`, `BackupService` |
| Danger zone | `SettingsService.resetAllData()` — two-step confirmation in UI |

### Backup (`src/types/backup.ts`, `src/services/BackupService.ts`)

| Piece | Role |
|-------|------|
| `backup.ts` | Schema v2, validation, sanitizers, `BackupError` codes |
| `BackupService` | Export payload, merge/replace import, portable settings filter |
| `BackupHealthService` | Last backup date, book/missing-PDF/annotation counts |
| UI | `ImportPreviewModal`, `ImportResultModal` |

See [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md) for field list and merge vs replace semantics.

### Notifications (`src/services/NotificationService.ts`)

- **Local only** — `expo-notifications` schedules on device
- **Lazy native load** — `loadNotificationsApi.ts` avoids crash in Expo Go
- **Prefs in SQLite** — times and enable flags; **not** scheduled notification IDs in backup
- **i18n** — `getNotificationMessages()` for reminder copy

### i18n (`src/i18n/`)

| File | Role |
|------|------|
| `translations.ts` | Nested `en` / `bn` trees |
| `translate.ts` | `translate(key, params)` with `{{param}}` interpolation |
| `I18nProvider.tsx` | Context; reload language from `LanguageService` |
| `useTranslation.ts` | `t()`, `setLanguage()` |

Keys use dot notation (`backup.mergeMode`, `pdfMissing.relink`). Bengali falls back to English for missing keys.

### Database / migrations (`src/db/`)

| Migration | File | Change |
|-----------|------|--------|
| 1 | `001_initial.ts` | Core tables: books, sessions, bookmarks, notes, goals, settings |
| 2 | `002_goal_sessions_type.ts` | `daily_goals.goal_type` includes `sessions` |
| 3 | `003_reflections.ts` | `reflections` table |
| 4 | `004_book_organization.ts` | `books.category`, `books.priority` |

Runner: `src/db/migrations/index.ts` + `database.native.ts` (`schema_migrations`).

**Repositories:** `BookRepository`, `SessionRepository`, `BookmarkRepository`, `NoteRepository`, `GoalRepository`, `SettingsRepository`, `ReflectionRepository` (direct import, not in barrel).

---

## 3. Data flow diagrams (ASCII)

### Import PDF

```
User taps "Import PDF"
        │
        ▼
library.tsx ──► useLibrary.importPdf()
        │
        ▼
BookService.importPdfBook()
        │
        ├──► pdfStorage.pickPdf()          (DocumentPicker)
        ├──► generateId() → bookId
        ├──► copyPdfToAppStorage(uri, bookId)
        │         └──► {document}/pdfs/{bookId}.pdf
        └──► BookRepository.createBook({ id, localUri, title, ... })
        │
        ▼
Library refreshes (useFocusEffect)
```

### Open reader

```
Navigate to /reader/[bookId]
        │
        ▼
usePdfReader(bookId)
        │
        ├──► useBook → BookRepository.getBookById
        ├──► ReaderPreferencesService.getPreferences()  (once)
        ├──► PdfReaderService.verifyBookForReading()
        │         └──► PdfAvailabilityService.isPdfAvailable()
        │               (block if missing → pdf_missing error)
        ├──► Freeze sessionFitPolicy, sessionEnablePaging
        ├──► initialResumePage from book.currentPage
        └──► pdfUri = PdfReaderService.resolveReaderUri(book)
        │
        ▼
ReaderPdfContent key={pdfUri}
        └──► PdfViewer (frozen page, fitPolicy, enablePaging)
                  └──► react-native-pdf
        │
        ├──► onPageChanged → debounced BookService.updateProgress
        └──► useReadingSession (timer; finish on exit)
```

### Save reading session

```
User opens reader
        │
        ▼
useReadingSession({ bookId, startPage, currentPage, enabled })
        │
        ├──► ReadingSessionService.startSession()   (in-memory)
        │
User reads… currentPage updates via onPageChanged
        │
User taps Finish OR leaves reader
        │
        ▼
ReadingSessionService.finishSession()
        │
        ├──► SessionRepository.createSession({ pagesRead, duration, mood, ... })
        └──► (optional) finish modal survey fields
        │
        ▼
Stats / streaks / goals recomputed on next read from session table
```

### Add note

```
Reader action bar → Note editor modal
        │
        ▼
NoteService.savePageNote(bookId, page, text)
        │
        ▼
NoteRepository.createNote() or update
        │
        ▼
notes row: (id, book_id, page_number, note_text, ...)
```

### Add bookmark

```
Reader action bar → toggle bookmark
        │
        ▼
BookmarkService.toggleBookmark(bookId, page)
        │
        ▼
BookmarkRepository.createBookmark() or delete
```

### Export backup

```
Settings → Export backup
        │
        ▼
BackupService.exportData()
        │
        ├──► createBackupPayload()
        │         ├──► BookRepository, SessionRepository, …
        │         ├──► filter portable settings only
        │         └──► backupVersion: 2, pdf_files_included: false
        ├──► JSON.stringify → cache file
        ├──► Sharing.shareAsync()
        └──► SettingsRepository.set(last_backup_at)
```

### Import backup

```
Settings → Import backup → pick JSON file
        │
        ▼
validateBackupJson() → BackupPreview modal
        │
User chooses merge | replace (+ double confirm if replace)
        │
        ▼
BackupService.importBackup(payload, mode)
        │
        ├──► merge: skip duplicate IDs; add new rows
        └──► replace: DELETE all tables → INSERT backup rows
        │
        ├──► normalizeBookFromBackup (category/priority defaults)
        ├──► PdfAvailabilityService → missingPdfCount
        └──► NotificationService.rescheduleAllFromSettings()
        │
        ▼
ImportResultModal (counts, relink warning)
```

### Relink missing PDF

```
Book shows "PDF missing" (PdfAvailabilityService)
        │
        ▼
BookService.relinkPdf(bookId)
        │
        ├──► pickPdf()
        ├──► copyPdfToAppStorage(uri, bookId)   (same bookId path)
        ├──► BookRepository.updateBook({ localUri, fileName, isDownloaded })
        │         └──► clamp currentPage if > known totalPages
        └──► sessions, notes, bookmarks unchanged
        │
        ▼
Reader can open via verifyBookForReading()
```

---

## 4. Important engineering decisions

### Local-first privacy

No account, no telemetry backend, no cloud library. User data stays on device unless they explicitly export JSON. This matches **personal-use** scope and reduces compliance surface.

### Offline usability

Every core flow works without network: read, annotate, stats, backup export. Import requires picking a file locally. PDFs must be on device or relinked after restore.

### SQLite repositories

One repository per aggregate root. SQL stays out of services and screens. `withDatabase()` queues work to avoid concurrent write races (especially during Metro fast refresh).

### Service layer

Services encode rules that span tables or files:

- `BookService` — import + relink + delete (DB + file)
- `BackupService` — portable settings whitelist, merge semantics
- `PdfReaderService` — URI normalization, page validation
- `ReadingSessionService` — session lifecycle

Hooks stay thin; services are testable units (no React).

### Migration system

Incremental numbered migrations; `schema_migrations` records applied versions. New columns use defaults so old rows remain valid (`category`, `priority` in v4). Backup import uses **normalizers**, not migrations, for legacy JSON.

### JSON backup design

- **Metadata only** — `pdf_files_included: false` always
- **Schema version** — `backupVersion` 2 (imports v1 and v2)
- **Validation before write** — invalid records skipped, not crash
- **Merge vs replace** — user choice; replace is destructive with double confirmation
- **Portable settings** — reader prefs, language, theme, notification times; not notification IDs

### Missing PDF relink strategy

- **Detect at runtime** — no extra DB column; `local_uri` may point to old device path
- **Preserve identity** — same `book.id`; copy new file to `pdfs/{bookId}.pdf`
- **Preserve reading data** — sessions, notes, bookmarks, `current_page` (clamped if needed)
- **Block reader** until relink — never pass invalid URI to `react-native-pdf`

### Why cloud sync is postponed (v1 → v2)

v1 proves: reader stability, backup safety, relink UX, and local analytics. Cloud sync adds:

- Identity, conflict resolution, partial offline queues
- PDF storage cost and upload UX
- Security review and multi-device testing

v1.4 **JSON backup + relink** is the intentional bridge for device migration without a server.

### PDF rendering props handled carefully

`react-native-pdf` is sensitive to prop changes. v1.3+ **freezes** at reader open:

- `fitPolicy` (from fit mode)
- `enablePaging` (from scroll mode)
- `initialPage` (auto-resume target)

No dynamic `key` except `pdfUri`. No post-load `setPage()` for auto-resume. See [READER_KNOWN_LIMITATIONS.md](./READER_KNOWN_LIMITATIONS.md).

---

## 5. Known fragile areas

| Area | Risk | Mitigation today |
|------|------|------------------|
| **react-native-pdf auto-resume** | Brief black flash; rare native crashes | Initial `page` prop only; fallback banner after ~1.5s |
| **Native PDF renderer** | NPE (`getMaxPageWidth`), app exit on bad URIs | Verify file before open; missing-PDF gate |
| **Focus / fit / scroll** | Dynamic prop changes remount or crash PDF | Session-frozen at open; settings apply next open |
| **Backup without PDFs** | Restored books unusable until relink | Missing-PDF UI, import summary, relink flow |
| **Android-first testing** | iOS/web paths less verified | Web uses stubs (`database.web.ts`, `PdfViewer.web.tsx`) |
| **Dev fast refresh** | SQLite "database locked" | Serialized `withDatabase()`; epoch invalidation on refresh |
| **Expo Go** | No native PDF module | Dev client required (`npx expo run:android`) |

Do not change reader PDF props casually without device regression per [READER_STABILITY_TEST_CHECKLIST.md](./READER_STABILITY_TEST_CHECKLIST.md).

---

## 6. Future v2 architecture bridge (cloud sync)

v2 is **not implemented**. This section describes likely schema and service changes for planning.

### Data model extensions (per table)

| Column | Purpose |
|--------|---------|
| `user_id` | Supabase Auth UUID — partition rows per account |
| `device_id` | Originating device for conflict debugging |
| `sync_status` | `local` \| `pending` \| `synced` \| `conflict` |
| `updated_at` | Server-truth timestamp for LWW or merge |
| `deleted_at` | Soft delete tombstone for sync propagation |

### Sync queue (local)

```
┌──────────────┐     push      ┌─────────────────┐
│ sync_queue   │ ────────────► │ Supabase Postgres│
│ (SQLite)     │ ◄──────────── │  (remote mirror) │
└──────────────┘     pull      └─────────────────┘
       │
       └── operations: INSERT/UPDATE/DELETE per entity
```

A `sync_queue` table (or outbox) records pending mutations while offline. A `SyncService` drains the queue when online, respects `updated_at`, and applies remote changes idempotently.

### Supabase stack (planned)

| Component | Role |
|-----------|------|
| **Supabase Auth** | Email/OAuth; `user_id` on all rows |
| **Supabase Postgres** | Remote copy of books metadata, sessions, notes, etc. |
| **Supabase Storage** | Optional PDF blobs (large); metadata still in Postgres |
| **Row Level Security** | `user_id = auth.uid()` on every table |

### Conflict resolution (open design)

Candidates:

- **Last-write-wins** on `updated_at` (simple; may lose edits)
- **Per-field merge** for notes/bookmarks
- **Append-only sessions** (conflicts rare)
- **PDF** — storage version wins; relink remains fallback for local-only PDFs

### What stays local-first

Even with sync, the app should **read and write SQLite first**, sync in background — same pattern as v1, plus queue. Reader must not block on network.

### PDF in cloud

Optional Phase 7 ([CLOUDINARY_BACKUP.md](./CLOUDINARY_BACKUP.md) discusses similar ideas). v1 intentionally uses **relink** instead of uploading PDFs in JSON backup.

---

## 7. What this project teaches

### Local-first architecture

Design for offline success first; sync is an enhancement, not a prerequisite. Tin Pata is usable on a plane with zero connectivity.

### Mobile file storage

Separate **large blobs** (PDF files) from **structured data** (SQLite). Use stable IDs in filenames (`{bookId}.pdf`). Copy on import; never trust picker paths long-term.

### SQLite migrations

Ship schema changes as numbered migrations with defaults. Never rewrite user DB by hand. Pair with **import normalizers** for external JSON that predates migrations.

### Repository pattern

Keep SQL in one place; map rows to domain types. Services compose repositories. Screens stay dumb.

### Offline data safety

JSON backup with validation, preview, merge/replace, and result summaries. Destructive actions use **two-step confirmation**. Backups declare `pdf_files_included: false` explicitly.

### Native module limitations

`react-native-pdf` and `expo-notifications` require dev/production builds. Props must be frozen. Failures are handled with user-visible errors, not stack traces.

### Release engineering

CNG: native folders generated locally, not committed. Versioned release checklists (`V1_4_RELEASE_CHECKLIST.md`). `typecheck` + `expo-doctor` before APK.

### Future cloud sync design

v1.4 forces you to solve **device migration without a server** (backup + relink). v2 must add identity, tombstones, queues, and conflict policy without breaking the reader stability rules established in v1.3.

---

## Appendix: key file index

| Concern | Path |
|---------|------|
| DB init + queue | `src/db/database.native.ts` |
| Migrations | `src/db/migrations/` |
| PDF files | `src/storage/pdfStorage.ts` |
| Backup types | `src/types/backup.ts` |
| Backup IO | `src/services/BackupService.ts` |
| Reader hook | `src/features/reader/usePdfReader.ts` |
| PDF viewer | `src/components/reader/PdfViewer.native.tsx` |
| Reader types/constraints | `src/types/reader.ts`, `src/services/ReaderStabilityService.ts` |
| Navigation helper | `src/utils/readerNavigation.ts` |
| App entry | `app/_layout.tsx` |

**Package:** `com.readinghabit.tracker` · **App version:** 1.4.0 (see `package.json`)
