# V2 Sync Conflict Rules

Concise conflict resolution for Tin Pata mobile metadata sync (v2.0E).

| Entity | Rule | Reason | Limitation |
|--------|------|--------|------------|
| **Books — metadata** | Latest `updated_at` wins (title, author, status, category, priority, totals) | Standard LWW for editable fields | Local `local_uri` is never overwritten from cloud |
| **Books — current page** | Latest `current_page_updated_at` wins | User may read backward intentionally; not highest page | Requires devices to update `current_page_updated_at` on page change |
| **Books — soft delete** | Remote `deleted_at` tombstone applies when remote is newer | Keeps delete state consistent across devices | Local hard-delete still exists when user deletes book in app |
| **Books — PDF cloud metadata** | Cloud fields (`cloud_storage_path`, `pdf_cloud_available`, `pdf_uploaded_at`, etc.) update when PDF metadata timestamp wins or book metadata wins | Cloud PDF state must sync without touching local file | PDF bytes are manual backup only; `local_uri` is device-local |
| **Reading sessions** | Append-only by stable `id`; upsert never overwrites a different session | Sessions are immutable events | Duplicate id with newer tombstone soft-deletes locally |
| **Notes** | Latest `updated_at` wins; `deleted_at` soft-deletes | Editable content | Orphan notes kept if `book_id` missing locally |
| **Bookmarks** | Latest `updated_at` wins; `deleted_at` soft-deletes | Editable content | Orphan bookmarks kept if `book_id` missing locally |
| **Daily goals** | Latest `updated_at` wins; `deleted_at` soft-deletes | Settings-like records | — |
| **Reflections** | Latest `updated_at` wins; `deleted_at` soft-deletes | Journal entries | — |
| **User settings** | Latest `updated_at` wins | Avoid overwriting newer local preference | Remote delete removes local setting row |
| **Sync queue** | Upsert/delete by stable entity id | Prevents duplicate pushes | One pending item per entity at a time |

## Multi-device scenarios

- **A — First device:** Sign in → link local data → Sync now pushes metadata.
- **B — Second device:** Sign in → link (empty) → Sync now pulls metadata → PDF shows cloud available (download) or relink needed.
- **C — Note conflict:** Same note edited on two devices → latest `updated_at` wins.
- **D — Page conflict:** Device B reads to an earlier page → latest `current_page_updated_at` wins (not highest page).
- **E — Cloud PDF deleted:** Local PDF and reading data remain; other device sees cloud unavailable unless it has a local copy.

## Data safety

- Deleting cloud PDF does not delete local PDF or notes/sessions.
- Pull apply uses soft-delete tombstones instead of hard-delete for synced entities (except settings).
- Sync never auto-deletes user reading data during repair.
