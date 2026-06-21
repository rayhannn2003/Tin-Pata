/** v2.0D — Supabase Storage PDF cloud backup metadata on books. */
export const MIGRATION_V7 = `
ALTER TABLE books ADD COLUMN cloud_storage_path TEXT;
ALTER TABLE books ADD COLUMN pdf_file_name TEXT;
ALTER TABLE books ADD COLUMN pdf_file_size INTEGER;
ALTER TABLE books ADD COLUMN pdf_sha256 TEXT;
ALTER TABLE books ADD COLUMN pdf_uploaded_at TEXT;
ALTER TABLE books ADD COLUMN pdf_cloud_available INTEGER NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN pdf_cloud_deleted_at TEXT;
`;
