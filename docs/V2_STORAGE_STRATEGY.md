# v2 Storage Strategy

How Tin Pata stores data locally and in Supabase (v2).

---

## Layers

| Layer | Technology | Contents |
|-------|------------|----------|
| Local SQLite | expo-sqlite | All reading metadata + sync fields |
| Local files | expo-file-system | PDFs at `{documentDirectory}/pdfs/{bookId}.pdf` |
| Supabase Postgres | `@supabase/supabase-js` | Metadata mirror (linked users) |
| Supabase Storage | `user-pdfs` bucket | Optional PDF bytes (manual) |

---

## PDF storage rules

1. **Primary read path:** always local file in reader
2. **Cloud backup:** manual upload, max **50 MB**
3. **Cloud delete:** removes Storage object only
4. **Download:** restores local file; metadata unchanged except `local_uri`
5. **Legacy Cloudinary columns:** unused; Supabase Storage is v2 path

---

## Path conventions

```
Local:   {documentDirectory}/pdfs/{bookId}.pdf
Cloud:   {userId}/books/{bookId}/original.pdf
```

---

## Sync vs PDF

- Metadata sync (v2.0C) syncs book **pointers** (`cloud_storage_path`, flags) via Postgres
- PDF upload/download (v2.0D) uses Storage API directly
- Sync queue never contains PDF bytes

---

## Backup JSON

- May export PDF cloud metadata fields
- Import resets cloud flags to local-only (`emptyPdfCloudFields`)
- PDF files never in JSON backup

---

## References

- [V2_PDF_CLOUD_BACKUP.md](./V2_PDF_CLOUD_BACKUP.md)
- [V2_METADATA_SYNC.md](./V2_METADATA_SYNC.md)
- [BACKUP_AND_RESTORE.md](./BACKUP_AND_RESTORE.md)
