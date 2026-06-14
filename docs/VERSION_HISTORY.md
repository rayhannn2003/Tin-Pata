# Version History

Tin Pata (তিনপাতা) — release notes for personal-use builds.

**Current stable:** **v1.3.0** (June 2026)

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
