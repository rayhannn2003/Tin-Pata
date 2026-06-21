-- Tin Pata v2.0D — Supabase Storage setup for PDF cloud backup
-- Run in Supabase SQL Editor after auth + metadata schema.
-- NEVER put service_role key in the mobile app.

-- ---------------------------------------------------------------------------
-- Private bucket for user PDFs
-- Path convention: {auth.uid()}/books/{book_id}/original.pdf
-- Max upload enforced in app: 50 MB
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-pdfs',
  'user-pdfs',
  false,
  52428800,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Storage policies — authenticated users access only their own folder
-- Folder rule: first path segment must equal auth.uid()
-- ---------------------------------------------------------------------------

create policy "user_pdfs_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'user-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_pdfs_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'books'
  );

create policy "user_pdfs_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_pdfs_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Optional: add PDF cloud columns to existing public.books (if created in v2.0C)
-- ---------------------------------------------------------------------------
alter table public.books add column if not exists cloud_storage_path text;
alter table public.books add column if not exists pdf_file_name text;
alter table public.books add column if not exists pdf_file_size integer;
alter table public.books add column if not exists pdf_sha256 text;
alter table public.books add column if not exists pdf_uploaded_at timestamptz;
alter table public.books add column if not exists pdf_cloud_available boolean not null default false;
alter table public.books add column if not exists pdf_cloud_deleted_at timestamptz;
