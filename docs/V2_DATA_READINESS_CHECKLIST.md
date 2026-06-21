# v2 Data Readiness Checklist

Short gate list before adding Supabase / cloud sync. **Not implemented in v1.5B.**

---

## Identity & timestamps

- [ ] **Stable UUIDs** — ✅ today (`Crypto.randomUUID`); never regenerate on sync
- [ ] **`updated_at` on all mutable tables** — ⚠️ partial (books, notes, settings only)
- [ ] **`deleted_at` (soft delete)** — ❌ hard delete today; required before sync
- [ ] **`user_id` on user-owned rows** — ❌ planned for v2
- [ ] **`device_id` on writes** — ❌ planned for v2
- [ ] **`sync_status` per row** — ❌ planned (`pending` / `synced` / `conflict`)
- [ ] **`last_synced_at`** — ❌ planned (row or table watermark)

---

## Integrity & conflicts

- [ ] **Conflict rules documented** — ❌ needed (LWW vs merge per entity)
- [ ] **Tombstones propagate** — ❌ depends on `deleted_at`
- [ ] **Bookmark uniqueness policy** — one per page; define cross-device duplicate handling
- [ ] **Single active daily goal** — enforce on import/sync or via DB constraint
- [ ] **Reflection orphan policy** — `book_id` nullable OK; sync nullable FK as-is

---

## Backup & migration

- [ ] **Local-to-cloud migration plan** — ❌ export JSON → upload rows + relink/cloud PDFs
- [ ] **Backup import must not break sync IDs** — preserve UUIDs; no remapping on merge
- [ ] **Replace import vs sync** — full local wipe conflicts with multi-device; cloud replaces local carefully
- [ ] **Backup version bump strategy** — increment `backupVersion` when sync fields added

---

## PDF storage

- [ ] **PDF path plan** — local `{documentDirectory}/pdfs/{bookId}.pdf` today
- [ ] **Remote storage key** — cloud `public_id` or signed URL field (legacy columns exist, unused)
- [ ] **Missing PDF flow** — keep runtime detection; add cloud download state in v2
- [ ] **Orphan PDF cleanup** — after replace/reset (not done today)

---

## Schema hygiene (optional pre-v2)

- [ ] DB CHECK for `category` / `priority` / `status`
- [ ] `updated_at` on `reading_sessions`, `bookmarks`, `daily_goals`, `reflections`
- [ ] Import pre-check for bookmark page duplicates

---

## References

- [DB_AUDIT.md](./DB_AUDIT.md) — table-level audit
- [BACKUP_AUDIT.md](./BACKUP_AUDIT.md) — import/export audit
- [ENGINEERING_ARCHITECTURE.md](./ENGINEERING_ARCHITECTURE.md) — v2 bridge overview
