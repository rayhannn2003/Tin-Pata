# v2.0C — Metadata Sync

Manual metadata sync between local SQLite and Supabase Postgres for signed-in users. **PDF files are not synced.**

---

## What syncs

| Entity | Notes |
|--------|--------|
| Books | Metadata only (title, progress, status, category, priority) |
| Reading sessions | Append-only by id |
| Notes | Latest `updated_at` wins |
| Bookmarks | Latest `updated_at` wins |
| Daily goals | On link + manual sync |
| Reflections | On link + manual sync |
| User settings | Portable reader/notification/theme/language keys only |

---

## PDF files (v2.0D)

Metadata sync (v2.0C) does **not** transfer PDF bytes. Optional PDF cloud backup (v2.0D) uses Supabase Storage separately — see [V2_PDF_CLOUD_BACKUP.md](./V2_PDF_CLOUD_BACKUP.md).

---

## Architecture

1. **SQLite** — offline source of truth while using the app
2. **sync_queue** — local outbox (`pending` → `processing` → `synced` / `error`)
3. **Supabase Postgres** — cloud copy per `user_id` (RLS)
4. **Manual sync** — Settings → Cloud sync → **Sync now**

---

## Sync queue

Table: `sync_queue` (migration v6)

| Column | Purpose |
|--------|---------|
| entity_type | `books`, `notes`, … |
| entity_id | Stable UUID (settings use setting key) |
| operation | `upsert` or `delete` |
| payload | JSON for upserts |
| status | `pending`, `processing`, `synced`, `error` |

Dedup: new upsert/delete replaces pending/error row for same entity.

Enqueue runs only when:

- User is signed in
- Local data is **linked** to that account (`tin_pata_linked_user_id`)
- Change is not from remote pull apply

---

## Local-to-cloud linking

**Not automatic on login.**

User must tap **Prepare local data for cloud sync** and confirm:

1. Sets `user_id` on local rows
2. Sets `sync_status = pending`
3. Stores linked user id in `sync_state`
4. Registers device in Supabase `devices`
5. Enqueues initial upserts for all linked rows

Nothing uploads until **Sync now**.

---

## Conflict rules (baseline)

| Entity | Rule |
|--------|------|
| reading_sessions | Append-only; skip if id exists locally |
| notes, bookmarks, goals, reflections, settings | Remote wins if `updated_at` ≥ local |
| books metadata | Remote wins if `updated_at` ≥ local |
| books current_page | Remote wins if `current_page_updated_at` ≥ local |
| deleted_at | Remote tombstone deletes local row |

No conflict resolver UI in v2.0C.

---

## Backup compatibility

Import still:

- Clears `user_id`
- Resets `sync_status` to `local`
- Re-stamps `device_id` to current device
- Does not mark rows as synced

User must re-link after restore if they want cloud sync again.

---

## Setup

1. Run [V2_SUPABASE_SETUP.sql](./V2_SUPABASE_SETUP.sql) (profiles)
2. Run [V2_SUPABASE_METADATA_SCHEMA.sql](./V2_SUPABASE_METADATA_SCHEMA.sql)
3. Configure `.env` with anon key + URL
4. Rebuild dev client if needed

---

## Code map

| Area | Path |
|------|------|
| Queue repo | `src/db/repositories/SyncQueueRepository.ts` |
| Queue service | `src/services/SyncQueueService.ts` |
| Enqueue | `src/services/SyncEnqueueService.ts` |
| Engine | `src/services/SyncEngineService.ts` |
| Apply pull | `src/services/SyncApplyService.ts` |
| Link | `src/services/SyncPreparationService.ts` |
| UI | `src/components/settings/CloudSyncSection.tsx` |

---

## Limitations

- Hard delete locally; remote delete uses soft `deleted_at`
- Goals/reflections enqueue on link + sync, not every service write (deferred)
- No multi-device conflict UI
- Pull creates book rows without PDF — relink required
- Network errors surface as sync failed (no NetInfo dependency)

---

## Related

- [V2_SYNC_STRATEGY.md](./V2_SYNC_STRATEGY.md)
- [V2_METADATA_SYNC_TEST_CHECKLIST.md](./V2_METADATA_SYNC_TEST_CHECKLIST.md)
- [V2_LOCAL_SYNC_FIELDS.md](./V2_LOCAL_SYNC_FIELDS.md)
