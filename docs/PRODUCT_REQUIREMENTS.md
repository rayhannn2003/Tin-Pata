# Product Requirements

## 1. Product Overview

**Reading Habit Tracker** is a personal mobile app that combines a PDF library, built-in reader, and reading habit tracker into one calm, private tool.

### In Simple Terms

| Aspect | Description |
|--------|-------------|
| **What it is** | A personal mobile app for one user (you) |
| **Core model** | Offline-first reading habit tracker with built-in PDF reader |
| **Primary goal** | Help overcome reader's block and build consistent reading discipline |
| **How it works** | Import PDFs → read inside the app → track sessions, pages, time, streak, and progress |
| **What it is not** | A public SaaS, social platform, or marketplace |

### Core Value Proposition

One private place to store target books, read them, remember where you left off, and get gentle encouragement to keep going — especially after missed days.

---

## 2. Problem Statement

### Problems This App Solves

| Problem | How the App Helps |
|---------|-------------------|
| **Hard to start reading** | Reader's Block Rescue Mode offers tiny, low-pressure entry points (1 page, 3 minutes, continue last book) |
| **Inconsistent reading habit** | Daily goals, streak tracking, and session history build awareness without guilt |
| **Forgotten progress** | Auto-saves current page; resume exactly where you left off |
| **Blocked after missing days** | Recovery-based messaging and rescue options instead of shame |
| **Need small pushes** | Home screen shows today's goal, current book, and streak at a glance |
| **Scattered PDFs** | Single library for all imported books with status and progress |

### What Success Looks Like

- You open the app and immediately see what to read next
- You read for even 3 minutes and the app records it positively
- After a missed week, one page restarts your streak without judgment
- All your reading PDFs and progress live in one place on your phone

---

## 3. Target User

**The target user is only you.**

| Attribute | Description |
|-----------|-------------|
| Role | Student / developer |
| Reading habits | Already reads PDFs and digital books |
| Goal | Build reading discipline and finish target books |
| Privacy need | Wants a private, personal reading system — not a social app |
| Technical comfort | Comfortable with mobile apps; has web development background |
| Constraints | Personal use only; no need for accounts, payments, or collaboration |

### User Needs (Prioritized)

1. Read my PDFs inside the app without switching tools
2. Never lose my place in a book
3. See whether I'm on track today without complex dashboards
4. Recover easily when I haven't read in days
5. Keep everything local and private by default

---

## 4. MVP Scope

### MVP Must Include

#### PDF Management
- [ ] Import/upload PDF from phone (document picker)
- [ ] Store PDF locally in app file storage
- [ ] Show PDF library list
- [ ] Rename PDF title
- [ ] Delete PDF

#### PDF Reader
- [ ] Open PDF inside the app
- [ ] Show current page and total pages
- [ ] Navigate pages (swipe, buttons, jump to page)
- [ ] Remember last page automatically
- [ ] Continue reading from last page

#### Reading Sessions
- [ ] Start reading session when reader opens
- [ ] Finish/end reading session on exit
- [ ] Track reading duration (timer pauses in background)
- [ ] Track start page and end page
- [ ] Calculate pages read per session
- [ ] Optional: focus level, mood, blocker reason

#### Goals & Progress
- [ ] Set daily reading goal (pages or minutes)
- [ ] Show today's progress toward goal
- [ ] Mark daily goal completed when target reached

#### Streak & Stats
- [ ] Show current streak
- [ ] Show longest streak
- [ ] Simple weekly stats (pages, minutes, reading days)

#### Reader's Block Rescue
- [ ] Rescue mode with low-pressure options (see Features doc)

#### Bookmarks & Notes
- [ ] Bookmark current page
- [ ] List and jump to bookmarks
- [ ] Add basic note for a page
- [ ] View, edit, delete notes

#### Data Layer
- [ ] Local SQLite database for all metadata
- [ ] Local file storage for PDF binaries

---

### MVP Must NOT Include

| Excluded Feature | Reason |
|------------------|--------|
| Public login / user accounts | Personal-use only; no multi-user need |
| Payment / subscriptions | Not a commercial product |
| AI summary or AI chat with PDF | Scope creep; not core to habit building |
| Social sharing | Personal private app |
| Public leaderboard | No social layer |
| Complex PDF annotation | Drawing, highlighting — defer to later |
| Multi-device sync (v1) | Local-first; Cloudinary is backup only, not live sync |
| Public cloud library | PDFs are personal imports only |
| Team collaboration | Single user |
| Marketplace / book store | User brings their own PDFs |

---

### MVP Acceptance Criteria

The MVP is complete when you can:

1. Import a PDF from your phone and see it in the library
2. Open it, read several pages, close the app, reopen, and resume on the same page
3. Finish a session and see pages read and duration recorded
4. Set a daily goal and see progress update as you read
5. See your streak after reading on consecutive days
6. Use Rescue Mode to read 1 page when stuck
7. Add a bookmark and a note, then jump back to that page later
8. Use the app fully offline with no backend required

---

### Out of Scope for MVP (Future Considerations)

- Cloudinary backup and restore (Phase 7)
- Text search inside PDF
- Reading reminders / push notifications
- Export stats
- Dark/light theme polish beyond basic support
- iPad-optimized layout
