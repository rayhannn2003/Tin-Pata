# Web PDF Reader (v2.1E)

Desktop-first continuous-scroll reader for synced Tin Pata books. Not OCR, search indexing, highlights, or AI.

## Architecture

```
/dashboard/reader/[bookId]   RSC loads book → dynamic Client ReaderExperience
                                  ↓
                         Signed URL (user-pdfs) → pdfjs-dist
                                  ↓
                    Virtualized continuous pages (@tanstack/react-virtual)
```

Dashboard chrome is hidden on reader routes so bookmarks/notes sidebars own the chrome. Browser fullscreen targets the reader shell.

## Component hierarchy

```
ReaderExperience
├── ReaderToolbar (back, page, zoom, bookmark, settings, fullscreen)
├── ReaderSidebar (left → ReaderBookmarks)
├── PdfContainer → PdfPage (canvas + text layer, lazy via virtualizer)
├── ReaderSidebar (right → ReaderNotes)
├── ReaderProgress
├── GoToPageDialog / NoteEditorDialog / ReaderSettings
├── ReaderLoading / ReaderError
└── Mobile floating actions + bottom drawers
```

## Data flow

1. Server: `BookService.getByIdForCurrentUser`.
2. Client: if `pdf_cloud_available` + `cloud_storage_path`, create a 1h signed URL for `user-pdfs`.
3. `pdfjs-dist` loads the document; resume at `current_page`.
4. Scroll updates the visible page (throttled); progress writes are **debounced ~1.8s** to `books.current_page` / `current_page_updated_at`.
5. Bookmarks & notes CRUD via Supabase (`device_id` from local web device id).
6. Session: in-memory start; on leave/hide, insert `reading_sessions` when duration ≥ 60s or page change.
7. Prefs in `user_settings`: zoom mode/scale, sidebar open, `theme_preference`.

## Sync behavior

Direct authenticated Supabase writes (same tables mobile sync uses). Debounced progress/prefs; immediate bookmark/note mutations; session flush on unmount/visibility hide. No separate offline queue.

## Performance decisions

- Dynamic import of reader + PDF container (`ssr: false`)
- PDF.js worker from `/public/pdf.worker.min.mjs`
- Window virtualization (overscan 2) for 300–1000 page docs
- Memoized page canvases + text layers; DPR capped at 2
- Cached `getTextContent()` per page; rebuild layer on zoom / fit-width
- Throttled scroll page detection; debounced cloud progress

## Future extensions

Placeholders: AI summaries, highlights, translation, TTS, heatmap, collections, PDF text search.

## Dictionary

- Toolbar **Dictionary** / **`D`**, **double-click** a word, or **select + right-click** (right-click again / Esc closes).
- Default mode: **English → Bangla**. Change anytime in **reader Settings** or **Dashboard → Settings → Dictionary**.
- Proxied via **`GET /api/dictionary`** with per-IP rate limit + in-memory cache; browser also caches successful lookups offline and keeps a recent list.
- **Save as note** uses a template (`word`, Bangla gloss, meanings, page).
- Optional page highlight via CSS Custom Highlight API (`::highlight(tinpata-dict-word)`).

## Checkpoints

- Toolbar **Checkpoint** / shortcut **`C`** → draw mode.
- Draw a horizontal line on the page to mark where you stopped; labeled with date & time.
- List / delete from left sidebar → **Checkpoints** tab (stored on this device per book).
- Esc exits draw mode.

## Out of scope

OCR, text search extraction, shared notes, offline PDF cache beyond signed URL fetch.
