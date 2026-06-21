# v2 Sync Strategy

High-level plan for Tin Pata cloud sync.

---

## Principles

1. **Local-first** — app works fully offline without an account
2. **Explicit opt-in** — user links data and taps Sync now; no silent migration on sign-in
3. **Metadata before PDFs** — reading data first; PDF cloud storage later
4. **Stable IDs** — UUIDs never regenerated; device id for conflict source
5. **Queue + manual sync** — v2.0C uses local outbox, not background workers

---

## Phases

| Phase | Scope | Status |
|-------|--------|--------|
| v2.0A | Supabase auth + profiles | Done |
| v2.0B | Local sync columns + device id | Done |
| v2.0C | Sync queue + metadata push/pull + link UI | Done |
| v2.0D | Soft delete everywhere + goal/reflection live enqueue | Planned |
| v2.0E+ | PDF cloud storage, background sync, conflict UI | Planned |

---

## Row lifecycle

```
local write (unlinked) → sync_status: local, no queue
link account           → user_id set, pending, queue seeded
local write (linked)   → pending + queue upsert
Sync now push OK       → synced + last_synced_at
pull remote            → apply with LWW / append rules
delete (future)        → deleted_at + queue delete op
```

---

## Conflict approach

- **Sessions:** append-only by id
- **Notes / bookmarks / goals / reflections / settings:** latest `updated_at` wins
- **Books:** metadata LWW; `current_page` uses `current_page_updated_at`
- **Deletes:** remote `deleted_at` removes local row (hard delete locally today)

Full resolver UI deferred.

---

## What v2.0C does not do

- PDF upload/download
- Automatic background sync
- Real-time subscriptions
- Destructive conflict UI
- Website / dashboard

---

## References

- [V2_METADATA_SYNC.md](./V2_METADATA_SYNC.md)
- [V2_SUPABASE_METADATA_SCHEMA.sql](./V2_SUPABASE_METADATA_SCHEMA.sql)
- [V2_LOCAL_SYNC_FIELDS.md](./V2_LOCAL_SYNC_FIELDS.md)
