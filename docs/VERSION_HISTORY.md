# Version History

Tin Pata (তিনপাতা) — release notes for personal-use builds.

**Current stable:** **v1.4.0** (June 2026)

---

## v1.5A — Engineering architecture documentation

Documentation-only milestone: [ENGINEERING_ARCHITECTURE.md](./ENGINEERING_ARCHITECTURE.md) — system design, module map, data flows, fragile areas, and v2 cloud sync bridge.

---

## v1.5B — Database and backup audit

Documentation-only audit: [DB_AUDIT.md](./DB_AUDIT.md), [BACKUP_AUDIT.md](./BACKUP_AUDIT.md), [V2_DATA_READINESS_CHECKLIST.md](./V2_DATA_READINESS_CHECKLIST.md). No schema or backup format changes.

---

## v1.5C — Frontend performance audit

Audit + small optimizations: [FRONTEND_PERFORMANCE_AUDIT.md](./FRONTEND_PERFORMANCE_AUDIT.md), [V2_FRONTEND_READINESS_CHECKLIST.md](./V2_FRONTEND_READINESS_CHECKLIST.md). Debounced annotation search, memoized list rows, cached PDF availability in library.

---

## v1.5D — DevOps and release engineering

Documentation-only: [DEVOPS_AND_RELEASE_ENGINEERING.md](./DEVOPS_AND_RELEASE_ENGINEERING.md), [RELEASE_PROCESS.md](./RELEASE_PROCESS.md), [ROLLBACK_AND_RECOVERY.md](./ROLLBACK_AND_RECOVERY.md), [ENVIRONMENT_AND_SECRETS.md](./ENVIRONMENT_AND_SECRETS.md), [V2_DEVOPS_READINESS_CHECKLIST.md](./V2_DEVOPS_READINESS_CHECKLIST.md). Added `.env` to `.gitignore`.

---

## v1.4.0 — Backup and Data Safety

Local backup and data protection release. No cloud sync.

**Highlights**

- **Backup schema versioning** — `appName`, `backupVersion`, `appVersion`, `exportedAt`, platform metadata
- **Safe import validation** — JSON structure checks, legacy compatibility, sanitized records
- **Import preview** — counts, version warnings, PDF-not-included notice before restore
- **Merge / replace restore** — user chooses mode; replace requires double confirmation
- **Import result summary** — imported/skipped counts, books needing PDF relink
- **Missing PDF detection** — runtime checks; calm library indicator
- **PDF relink flow** — restore progress, notes, bookmarks after choosing a PDF file
- **Destructive action safeguards** — reset, replace import, book delete use two-step confirmation
- **Backup health card** — last backup date, book/PDF/annotation counts in Settings

**Internal milestones:** v1.4A backup audit · v1.4B missing PDF relink · v1.4C release QA

---

## v1.3.0 — Safe reader modes (Focus, Fit, Scroll)

Reader customization release with session-frozen PDF props for stability.

**Highlights**

- **Focus Mode** — hides toolbar and action bar; exit via Android back / edge swipe; optional default-on in settings
- **Fit Mode** — Auto, Fit Width, Fit Page; frozen at reader open via `fitPolicy`
- **Scroll Mode** — Vertical (continuous) or Horizontal (page-by-page paging); frozen at reader open via `enablePaging`
- Fit and scroll changes apply **next time you open the reader**, never on a mounted PDF
- English and Bengali for all new reader preference labels

**Internal milestones:** v1.3A focus mode · v1.3B fit mode · v1.3C scroll mode & release QA

---

## v1.2.0 — Library organization & reading insights

Feature release building on v1.1 reader stability.

**Highlights**

- **Library organization** — categories, reading priority, sort, and improved filters
- **Notes & bookmarks search** — global lists with search; open reader at page safely
- **Reading insights** — best day, time range, averages, blockers/mood/focus patterns
- **Book analytics** — per-book averages, best session, estimated finish date
- **Stats screen** — reorganized: Today, This Week, All Time, Insights, Habit Calendar
- English and Bengali for all new labels

**Internal milestones:** v1.2A library organization · v1.2B notes/bookmarks · v1.2C insights & release QA

---

## v1.1.4 — Reader comfort & stability (v1.1 final)

Stable personal release. Reader stability cleanup, safe comfort features, CNG/prebuild policy, and production QA.

**Highlights**

- Safe auto-resume via initial `page` prop (known brief black flash — see [KNOWN_LIMITATIONS.md](./KNOWN_LIMITATIONS.md))
- Reader stability mode (`safe`) — no dynamic fit/scroll/focus on PDF
- Keep screen awake (reader only)
- Reader brightness control (requires dev/production build with `expo-brightness`)
- Reader comfort panel (brightness + UI visibility toggles)
- Book detail screen with per-book stats and recent sessions
- Improved backup UX and portable reader settings in JSON export
- SQLite access serialized to prevent dev reload lock errors
- CNG: `android/` and `ios/` generated locally, not committed

**Internal milestones:** v1.1.1–v1.1.3 stability patches · v1.1.4A cleanup · v1.1.4B comfort · v1.1.4C release QA

---

## v1.1.0–v1.1.3 — Reader comfort update (incremental)

**Reader & UI**

- Book detail screen
- Per-book reading stats
- Safe reader settings foundation
- Auto-resume restored with fallback banner
- PDF crash prevention (no post-load auto `setPage`)

**Platform**

- CNG / prebuild cleanup
- Emergency stability patches for react-native-pdf
- `.gitignore` / `.easignore` native folder policy

---

## v1.0.0 — Initial stable personal APK

First complete offline-first personal reading app.

**Features**

- PDF import and in-app reader
- Reading sessions, page progress, continue reading
- Daily goals, streaks, weekly stats
- Bookmarks and per-page notes
- Reader's Block Rescue mode
- Local notifications (reading / missed goal / rescue reminders)
- JSON backup export/import (reading data + settings, not PDF files)
- Theme picker (System / Light / Dark)
- English and Bengali UI

---

## Versioning policy

- **Major (x.0.0):** New product phase or breaking data format
- **Minor (1.x.0):** Feature releases (v1.2 = library + insights)
- **Patch (1.1.x):** Stability, comfort, and QA fixes within a minor line

See also: [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md), [V1_2_RELEASE_CHECKLIST.md](./V1_2_RELEASE_CHECKLIST.md)
