# Web PDF Reader (v2.1E)

Desktop-first continuous-scroll reader for synced Tin Pata books.

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
├── ReaderToolbar (back, page, zoom, bookmark, summary, settings, fullscreen)
├── ReaderSidebar (left → ReaderBookmarks)
├── PdfContainer → PdfPage (canvas + text layer, lazy via virtualizer)
├── ReaderSidebar (right → ReaderNotes)
├── ReaderProgress
├── GoToPageDialog / NoteEditorDialog / AiSummaryDialog / ReaderSettings
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

## AI summaries

- Toolbar **AI Summary** / shortcut **`S`**.
- Scope: current page, a 1–30 page range, or a chapter when the PDF has an outline.
- Output: English or Bangla; short or detailed.
- PDF.js extracts selectable text in the browser, then sends only the chosen text to the
  authenticated server route `POST /api/summaries`.
- The server verifies book ownership, checks Supabase cache, atomically consumes the daily quota,
  chunks long text, calls Gemini Flash, combines partial summaries, and caches the result.
- Limit: 20 generated summaries per user per UTC day. Cache hits do not consume quota.
- **Save summary as note** opens the editable note dialog at the first summarized page.
- Scanned PDFs require future OCR and cannot currently be summarized.
- Setup: server-only `GEMINI_API_KEY` plus
  `docs/V2_SUPABASE_AI_SUMMARIES.sql`.

Privacy: selected book text leaves the browser and is processed by Google Gemini. Free-tier data
handling is governed by Google's current Gemini Developer API terms.

## Future extensions

Placeholders: persistent highlights, translation, TTS, heatmap, collections, PDF text search, OCR.

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

## Explain selected text (Tin Pata AI, v2.2A)

- Select a passage in the text layer → a floating **✨ Explain** chip appears; click it to open the
  explanation panel. Selections shorter than 12 characters show no chip — single words go to the
  Dictionary. The chip is dismissed on scroll, resize, Escape, or the next mousedown, and never
  appears in checkpoint draw mode.
- Six modes: **Simple English**, **Very Simple**, **বাংলা**, **English + বাংলা**, **Vocabulary**,
  **Sentence by sentence**. The last mode used is saved as `ai_default_explanation_mode` in
  `user_settings` — deliberately independent of the UI language.
- The panel (`components/ai/ExplanationPanel.tsx`) is non-modal: the PDF stays scrollable and
  readable. Actions: Copy (plain text), Regenerate, Close. Each request is independent — there is no
  conversation history.
- `services/AIService.ts` posts a structured intent (never a free-form prompt) to the
  **`ai-reading-assistant` Supabase Edge Function**, which holds `OPENAI_API_KEY` server-side and
  returns JSON-schema structured output. OpenAI is never called from the browser.
- Limits: 12,000 characters per selection (rejected, never truncated), ~150–400 word answers, low
  reasoning effort, soft rate guard of 20 requests / 5 min per user.
- Privacy: only the selected text is sent. Not the whole PDF, not notes, not other books. The
  passage is never logged or persisted. See `docs/AI_ARCHITECTURE.md` and `docs/AI_SETUP.md`.
- Scanned image-only PDFs have no text layer, so no chip appears — the existing "no selectable text"
  banner still shows. No OCR.

## Out of scope

OCR, text search extraction, shared notes, offline PDF cache beyond signed URL fetch.
