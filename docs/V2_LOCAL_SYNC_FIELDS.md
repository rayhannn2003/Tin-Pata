# v2.0B — Local Sync Fields

Prepares the local SQLite schema and app services for future cloud sync. **No cloud sync runs in this phase.**

---

## Why sync metadata

Before uploading or merging data across devices, each row needs:

- A stable **record id** (already UUID)
- A **device id** for conflict attribution
- An optional **user id** after account linking
- **Timestamps** for last change and sync
- **Soft-delete** tombstones (columns added; hard delete still used — see below)

---

## Fields added

| Column | Purpose |
|--------|---------|
| `user_id` | Supabase user after future link migration; `NULL` for local-only |
| `device_id` | Device that last wrote the row |
| `sync_status` | `local` \| `pending` \| `synced` \| `error` \| `conflict` |
| `last_synced_at` | Last successful cloud sync (unused until sync worker) |
| `updated_at` | Last local mutation (added/backfilled where missing) |
| `deleted_at` | Soft-delete tombstone (unused until v2.0C+) |
| `current_page_updated_at` | Books only — when reading progress last changed |

Default for existing rows after migration v5: `sync_status = 'local'`, timestamps backfilled from `created_at` / `updated_at`.

---

## Tables changed

- `books`
- `reading_sessions`
- `bookmarks`
- `notes`
- `daily_goals`
- `reflections`

Settings: `tin_pata_device_id` stored separately (not exported in backup).

---

## Device identity

`DeviceIdentityService` generates one UUID on first launch, stored in settings as `tin_pata_device_id`. Same value across restarts; only changes on full app data reset or `resetDeviceId()` (debug).

Initialized after DB migration in `DatabaseProvider`.

---

## Local-only mode

- No login required
- `user_id` stays `NULL`
- New writes get `device_id` + `sync_status: 'local'` via repositories
- Sign-in does **not** upload or link data automatically

---

## Soft delete plan

Reads filter `deleted_at IS NULL`. Deletes are still **hard delete** for notes, bookmarks, books, etc. Converting to soft delete is a **v2.0C/v2.0D** follow-up to avoid breaking existing UX.

Helpers exist in `src/utils/syncMetadata.ts` (`markDeleted`, `isSyncableDeleted`).

---

## Backup / import

**Export:** Sync fields may appear in JSON (from repository reads). `tin_pata_device_id` is **never** exported.

**Import (merge or replace):**

- Record UUIDs preserved
- `user_id` cleared (`NULL`)
- `device_id` set to **current device**
- `sync_status` reset to `local`
- `last_synced_at` / `deleted_at` cleared
- Replace import keeps current device id in settings (not wiped)

Old backups without sync fields still import via sanitizers + `emptySyncMetadata()`.

---

## Code map

| Area | Path |
|------|------|
| Types | `src/types/sync.ts` |
| Helpers | `src/utils/syncMetadata.ts` |
| Device id | `src/services/DeviceIdentityService.ts` |
| Link prep (manual) | `src/services/SyncPreparationService.ts` |
| Migration | `src/db/migrations/005_sync_metadata.ts` |
| Write stamps | `src/db/syncWriteHelpers.ts` |
| UI status | Settings → Account → `SyncReadinessSection` |

---

## Next phase

**v2.0C+:** metadata sync to Supabase, sync queue, soft deletes, user link migration, conflict handling. See [V2_SYNC_STRATEGY.md](./V2_SYNC_STRATEGY.md).

---

## Related

- [V2_SYNC_STRATEGY.md](./V2_SYNC_STRATEGY.md)
- [V2_LOCAL_SYNC_FIELDS_TEST_CHECKLIST.md](./V2_LOCAL_SYNC_FIELDS_TEST_CHECKLIST.md)
- [V2_DATA_READINESS_CHECKLIST.md](./V2_DATA_READINESS_CHECKLIST.md)
