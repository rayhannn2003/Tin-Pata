# v2 Data Readiness Checklist

Gate list for cloud sync. Updated after **v2.0C**.

---

## Identity & timestamps

- [x] **Stable UUIDs** — record ids via `Crypto.randomUUID`
- [x] **`updated_at` on all mutable tables**
- [ ] **`deleted_at` (soft delete)** — remote soft delete; local still hard delete (v2.0D)
- [x] **`user_id` on user-owned rows** — set on manual link
- [x] **`device_id` on writes**
- [x] **`sync_status` per row**
- [x] **`last_synced_at`** — updated after successful push

---

## Sync infrastructure

- [x] **Local sync queue** — `sync_queue` table + services
- [x] **Supabase metadata tables** — see `V2_SUPABASE_METADATA_SCHEMA.sql`
- [x] **Manual sync engine** — push queue + pull since last pull
- [x] **Link local data UI** — confirm before linking
- [ ] **Background sync worker** — not in v2.0C
- [ ] **Conflict resolver UI** — baseline LWW only

---

## Integrity & conflicts

- [x] **Conflict rules documented** — [V2_METADATA_SYNC.md](./V2_METADATA_SYNC.md)
- [ ] **Tombstones propagate locally** — pull delete only
- [ ] **Bookmark uniqueness policy** — cross-device duplicates TBD
- [ ] **Single active daily goal** — server constraint TBD

---

## Backup & migration

- [x] **Backup import resets sync state** — local + no user_id
- [x] **Preserve UUIDs on import**
- [ ] **Backup version bump for sync fields** — optional in JSON

---

## PDF storage

- [ ] **PDF cloud path** — not implemented
- [x] **Missing PDF relink** — still local-only

---

## References

- [V2_METADATA_SYNC.md](./V2_METADATA_SYNC.md)
- [V2_SYNC_STRATEGY.md](./V2_SYNC_STRATEGY.md)
- [DB_AUDIT.md](./DB_AUDIT.md)
- [BACKUP_AUDIT.md](./BACKUP_AUDIT.md)
