-- Tin Pata — Book cover images
-- Run in Supabase SQL Editor after V2_SUPABASE_STORAGE_SETUP.sql
-- Path convention: {auth.uid()}/books/{book_id}/cover.jpg (or .png / .webp)

alter table public.books add column if not exists cover_image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-covers',
  'user-covers',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "user_covers_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'user-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_covers_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'books'
  );

create policy "user_covers_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'user-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "user_covers_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
