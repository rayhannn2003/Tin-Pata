# Frontend Performance Audit

**App:** Tin Pata v1.4.0 · **Stack:** Expo RN + TypeScript + SQLite  
**Audited:** v1.5C (June 2026)

---

## Screen Summary

| Screen | Main responsibility | Performance risk | Recommendation |
|--------|---------------------|------------------|----------------|
| Home | Dashboard cards, calendar | 5 independent `useFocusEffect` hooks → 5 DB fetches per visit | Shared home data hook later (P1) |
| Library | Filter/sort book list | `.map()` in `ScrollView`; sync PDF file check per row | Memo rows; cache PDF availability at load (applied) |
| Book detail | Meta, stats, annotations | 4 hooks = 4+ DB round trips | OK for one book; batch later if slow |
| Reader | PDF + session + modals | PDF remount if native props change | Keep session-frozen props; UI-only updates safe |
| Stats | Aggregates + insights | 4 focus hooks; overlaps Home streak/weekly | Shared stats cache (P1) |
| Settings | Prefs, backup, reflections | Long `ScrollView`; fine for settings count | OK |
| Notes / Bookmarks | Searchable lists | Search triggered extra loads on keystroke | Debounced search in hook (applied) |
| Backup UI | Export/import modals | Runs on user action only | OK |

---

## State Ownership

| State | Current owner | Good/Bad | Note |
|-------|---------------|----------|------|
| Books library | `useLibrary` → SQLite | Good | Refreshes on tab focus |
| Book record | `useBook` → SQLite | Good | Per-screen local state |
| Reader page/progress | `usePdfReader` + SQLite | Good | Debounced page save |
| Session timer | `useReadingSession` local | Good | Must stay out of PDF props |
| Reader fit/scroll | Settings + session-frozen in hook | Good | Frozen at open — avoids remount |
| Theme / i18n | Context providers | Good | Memoized context values |
| Filters/search | Screen `useState` | Good | Library filters memoized |
| PDF missing | Derived from filesystem | OK | Cache when list loads, not per render |
| Navigation params | Expo Router | Good | `bookId` drives data hooks |

**Pattern:** Screen → feature hook → service → repository. No global Redux — appropriate for v1.

---

## Rendering Risks

| Risk | Area | Severity | Recommendation |
|------|------|----------|----------------|
| PDF remount on prop change | Reader | **High** | Never change `uri`, `fitPolicy`, `enablePaging`, `initialPage` mid-session |
| Sync `fileExists` per list row | Library | Medium | Compute once when books load (applied) |
| Inline arrow props in lists | Library, notes | Medium | Stable callbacks + `React.memo` on rows (applied) |
| Home duplicate stats queries | Home + Stats tabs | Medium | Consolidate streak/weekly fetch (P1) |
| `useLibrary` N+1 annotation counts | Library load | Medium | Batch SQL join later (P1) |
| Search reload on every keystroke | Notes/bookmarks hooks | Medium | Debounce search state (applied) |
| Library `.map()` not virtualized | Library | Low | FlatList when library grows (P2) |
| Nested scroll (`ScreenContainer`) | Most tabs | Low | OK for small lists; avoid FlatList inside ScrollView without care |
| Reader screen many modals | Reader | Low | Conditionally mounted; OK |
| Theme color inline styles | Everywhere | Low | Acceptable; StyleSheet where hot |

---

## List Performance

| List | Current approach | Risk | Fix |
|------|------------------|------|-----|
| Library | `filteredBooks.map()` in ScrollView | No virtualization | FlatList + `nestedScrollEnabled` if > ~30 books (P2) |
| Notes | FlatList | Inline `renderItem` | Memo row + stable handler (applied) |
| Bookmarks | FlatList | Same | Same (applied) |
| Reflections (Settings) | FlatList | Small list | OK |
| Recent sessions (book detail) | `.map()` ≤10 rows | Low | OK |
| Reader bookmark/note modals | FlatList | Short lists | OK |

**Library filters:** `organizeLibraryBooks` already in `useMemo` — good.

---

## Reader Performance Notes

- **Stable props:** `uri`, session-frozen `fitPolicy`, `enablePaging`, `initialPage` — frozen in refs inside `PdfViewer.native.tsx`.
- **No dynamic `key`:** Do not key `PdfViewer` on page or prefs — forces full native remount.
- **No mid-session native prop updates:** Fit/scroll prefs apply on next reader open only.
- **Black flash on auto-resume:** Known `react-native-pdf` limitation when opening away from page 1; mitigated by frozen `initialPage` + `setPage` ref — not fully eliminable.
- **Safe controls:** Toolbar, timers, brightness overlay, focus mode hide UI, modals — React state only.
- **Unsafe changes:** Live `fitPolicy`/`enablePaging`/`source` updates, remounting PDF on theme change, passing unstable inline callbacks without ref pattern to `ReaderPdfContent`.
- **Guard layers:** `ReaderPdfContent` custom `memo` compare + `PdfViewer` `memo` + callback refs for handlers.

---

## Low-risk Optimizations Applied

- Debounced search in `useAllNotes` / `useAllBookmarks` (avoids DB query per keystroke + duplicate focus load).
- PDF availability map in library screen (one filesystem check per book per load, not per render).
- `React.memo` on `BookListItem`, `NoteListItem`, `BookmarkListItem`.
- Stable FlatList handlers in notes/bookmarks screens.

---

## Future Optimization Backlog

**P0 (bugs / user-visible jank)**

- None identified that require immediate code change beyond applied fixes.

**P1 (before v2)**

- Shared `useHomeDashboardData` / stats cache to dedupe Home + Stats DB calls.
- Batch bookmark/note counts in library SQL (remove N+1 in `getLibraryBooksWithCounts`).
- Virtualized library list if users report lag with large shelves.

**P2 (later)**

- Global lightweight query cache for SQLite reads.
- `FlashList` evaluation if lists grow significantly.
- Split reader screen into smaller memoized subtrees (toolbar vs PDF layer).
