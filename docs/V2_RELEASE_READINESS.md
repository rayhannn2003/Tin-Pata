# V2 Release Readiness (Mobile)

Status for Tin Pata **2.0.0-alpha.5** — conflict handling and sync QA phase.

## Complete (v2.0A–E)

- Supabase auth + profile (2.0A)
- Local sync fields + device identity (2.0B)
- Sync queue + manual metadata sync (2.0C)
- Manual PDF cloud backup/download/delete ≤50 MB (2.0D)
- Conflict rules enforced on pull apply (2.0E)
- Sync integrity check + safe repair helpers (2.0E)
- Settings sync UI: status, retry, sync check, clear synced queue (2.0E)
- Resilient push (continues on per-item failure) (2.0E)
- i18n EN/BN for sync health strings (2.0E)
- Sync QA / conflict / troubleshooting docs (2.0E)

## Not complete (by design)

- Website / Next.js (v2.1)
- Automatic PDF upload
- Background sync
- Real-time Supabase subscriptions
- AI summary
- Stable **2.0.0** GA (await QA)

## Known limitations

- PDF backup is manual only; metadata sync is separate.
- `local_uri` is never synced — each device manages its own PDF path.
- Local book delete may still hard-delete locally; remote uses soft-delete tombstones.
- Orphan notes/bookmarks possible if book missing — kept intentionally.
- Sync is manual (Sync now); no background scheduler.
- Large PDFs (>50 MB) cannot be cloud-backed up in app.
- Second device must download or relink PDFs separately.

## Before v2.1 website checklist

- [ ] Complete `docs/V2_SYNC_QA_CHECKLIST.md` on two Android devices
- [ ] Verify note/page conflicts on two devices
- [ ] Verify cloud PDF delete + second device behavior
- [ ] Confirm backup/export/import after sync
- [ ] No open P0 sync bugs
- [ ] Promote to `2.0.0-rc.1` after QA pass (not before)

## Ready for v2.1 planning?

**Yes, for planning** — mobile sync architecture, conflict rules, and repair tooling are in place.

**Not yet for website build** — run full multi-device QA and promote to RC before treating mobile sync as production-stable.
