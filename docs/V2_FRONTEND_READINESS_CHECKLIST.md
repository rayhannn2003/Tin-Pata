# v2 Frontend Readiness Checklist

Gate list before cloud sync + possible web client. **Not implemented in v1.5C.**

---

## Architecture

- [ ] **Separate business logic from UI** — services/types pure; screens thin
- [ ] **Reusable feature hooks** — `useLibrary`, `usePdfReader` patterns work without RN imports where possible
- [ ] **No mobile-only assumptions in pure logic** — file paths only in `pdfStorage` / platform adapters
- [ ] **API/sync layer separate from screens** — no SQLite calls directly in `app/` routes (mostly done via hooks)
- [ ] **Loading / error / empty states** — exist locally; extend for network/sync failures

---

## Data & state

- [ ] **Shared stats package** — move `ReadingInsightsService`, streak/weekly calculators to importable TS module
- [ ] **Derived vs persisted state** — document what sync owns vs local cache
- [ ] **Optimistic UI pattern** — prepare for sync queue without blocking reader
- [ ] **Conflict UI placeholders** — settings or book detail “sync issue” state (future)

---

## Platform

- [ ] **PDF reader adapter** — keep `ReaderPdfContent.native` / `.web` split; v2 cloud PDF via adapter
- [ ] **Storage paths** — all paths through `src/storage/`; no hardcoded Android paths in screens
- [ ] **Web parity** — hooks already guard `Platform.OS === 'web'`; expand deliberately in v2

---

## i18n & UI

- [ ] **i18n strings organized** — keys in `translations.ts`; ready for remote copy later
- [ ] **List virtualization** — FlatList/FlashList for cloud-backed large libraries
- [ ] **Skeleton / stale-while-revalidate** — for network fetches in v2

---

## Reader (do not break)

- [ ] **Session-frozen PDF props** — preserve v1.3+ stability contract in any refactor
- [ ] **UI-only updates while reading** — brightness, toolbar, modals must not touch native PDF props
- [ ] **Platform adapter documents remount rules** — link to `FRONTEND_PERFORMANCE_AUDIT.md`

---

## References

- [FRONTEND_PERFORMANCE_AUDIT.md](./FRONTEND_PERFORMANCE_AUDIT.md)
- [ENGINEERING_ARCHITECTURE.md](./ENGINEERING_ARCHITECTURE.md)
- [V2_DATA_READINESS_CHECKLIST.md](./V2_DATA_READINESS_CHECKLIST.md)
