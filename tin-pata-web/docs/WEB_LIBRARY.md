# Web Library (v2.1D)

Library management and book detail for Tin Pata web. Not a PDF reader.

## Page hierarchy

```
/dashboard/library              List + search / filter / sort
/dashboard/library/[bookId]     Book detail (stats, sessions, previews)
```

Shell, auth, and other dashboard routes are unchanged.

## Component tree

```
library/page (RSC)
└── LibraryClient (client)
    ├── LibraryToolbar
    ├── LibraryFilters
    ├── BookGrid | BookList
    │   └── BookCard
    │       ├── badges, BookProgress
    │       └── BookActionsMenu
    └── BookEmptyState | filter-empty + extension placeholders

library/[bookId]/page (RSC)
├── BookHero (+ BookActionsMenu)
├── main
│   ├── RecentSessionsCard
│   ├── BookmarksPreview / NotesPreview
│   └── future placeholders
└── aside
    ├── BookStatsCard
    └── BookMetadataCard
```

Reusable pieces live under `components/library/`.

## Data flow

1. Server Components call `BookService` / `LibraryAnnotationService` with the Supabase server client.
2. Queries are scoped to `auth.uid()` and `deleted_at IS NULL` (RLS + explicit filters).
3. List load: `books` + counted `notes` / `bookmarks` by `book_id`.
4. Detail load: one book + session stats + recent sessions / notes / bookmarks.
5. Mutations (rename, status, soft delete) use server actions in `library/actions.ts`, then `revalidatePath`.
6. Search / filter / sort / view mode run on the client over the server-fetched list. View mode is stored in `localStorage` (`tin-pata.library.viewMode`).

**last read:** schema has no `last_read_at`; UI uses `current_page_updated_at` (fallback `updated_at`). Session-derived first/last read appear on the detail stats card.

## Responsive behavior

- **Library:** toolbar stacks on small screens; grid is 1 → 2 → 3 columns; list is a stacked card layout.
- **Detail:** single column on mobile; from `lg`, two columns with sticky sidebar stats/metadata.

## Future extension points

Placeholders only (not implemented): cloud sync status, reader launch, heatmap, collections, tags, AI summaries, full notes/bookmarks editors.

## Out of scope (historical)

Older notes excluded web upload; **web PDF upload (max 20 MB) is now supported** via Library → Upload PDF.

Still later: OCR, shared notes, AI.
