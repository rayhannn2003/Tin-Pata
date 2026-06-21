-- Tin Pata v2.0C — Supabase metadata sync schema draft
-- Run in Supabase SQL Editor after V2_SUPABASE_SETUP.sql (profiles).
-- NEVER put service_role key in the mobile app.

-- ---------------------------------------------------------------------------
-- Devices (one row per app install / device_id)
-- ---------------------------------------------------------------------------
create table if not exists public.devices (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  label text,
  platform text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

alter table public.devices enable row level security;

create policy "devices_select_own"
  on public.devices for select
  using (auth.uid() = user_id);

create policy "devices_insert_own"
  on public.devices for insert
  with check (auth.uid() = user_id);

create policy "devices_update_own"
  on public.devices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Per-user sync watermark (optional server-side mirror of client sync_state)
-- ---------------------------------------------------------------------------
create table if not exists public.sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_sync_at timestamptz,
  last_pull_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.sync_state enable row level security;

create policy "sync_state_select_own"
  on public.sync_state for select
  using (auth.uid() = user_id);

create policy "sync_state_insert_own"
  on public.sync_state for insert
  with check (auth.uid() = user_id);

create policy "sync_state_update_own"
  on public.sync_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Books (metadata + PDF cloud pointers — bytes in Storage bucket user-pdfs)
-- ---------------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  title text not null,
  author text,
  total_pages integer not null default 0,
  current_page integer not null default 1,
  current_page_updated_at timestamptz,
  status text not null default 'not_started',
  category text not null default 'general',
  priority text not null default 'normal',
  cloud_storage_path text,
  pdf_file_name text,
  pdf_file_size integer,
  pdf_sha256 text,
  pdf_uploaded_at timestamptz,
  pdf_cloud_available boolean not null default false,
  pdf_cloud_deleted_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists books_user_updated_idx on public.books (user_id, updated_at);

alter table public.books enable row level security;

create policy "books_select_own" on public.books for select using (auth.uid() = user_id);
create policy "books_insert_own" on public.books for insert with check (auth.uid() = user_id);
create policy "books_update_own" on public.books for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Reading sessions (append-only by id)
-- ---------------------------------------------------------------------------
create table if not exists public.reading_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  book_id uuid not null,
  start_page integer not null,
  end_page integer not null,
  pages_read integer not null default 0,
  duration_seconds integer not null default 0,
  focus_level integer,
  mood text,
  blocker_reason text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists reading_sessions_user_updated_idx
  on public.reading_sessions (user_id, updated_at);

alter table public.reading_sessions enable row level security;

create policy "reading_sessions_select_own" on public.reading_sessions for select using (auth.uid() = user_id);
create policy "reading_sessions_insert_own" on public.reading_sessions for insert with check (auth.uid() = user_id);
create policy "reading_sessions_update_own" on public.reading_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  book_id uuid not null,
  page_number integer not null,
  note_text text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at);

alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Bookmarks
-- ---------------------------------------------------------------------------
create table if not exists public.bookmarks (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  book_id uuid not null,
  page_number integer not null,
  title text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists bookmarks_user_updated_idx on public.bookmarks (user_id, updated_at);

alter table public.bookmarks enable row level security;

create policy "bookmarks_select_own" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_update_own" on public.bookmarks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Daily goals
-- ---------------------------------------------------------------------------
create table if not exists public.daily_goals (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  goal_type text not null,
  target_value integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists daily_goals_user_updated_idx on public.daily_goals (user_id, updated_at);

alter table public.daily_goals enable row level security;

create policy "daily_goals_select_own" on public.daily_goals for select using (auth.uid() = user_id);
create policy "daily_goals_insert_own" on public.daily_goals for insert with check (auth.uid() = user_id);
create policy "daily_goals_update_own" on public.daily_goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Reflections
-- ---------------------------------------------------------------------------
create table if not exists public.reflections (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  text text not null,
  book_id uuid,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists reflections_user_updated_idx on public.reflections (user_id, updated_at);

alter table public.reflections enable row level security;

create policy "reflections_select_own" on public.reflections for select using (auth.uid() = user_id);
create policy "reflections_insert_own" on public.reflections for insert with check (auth.uid() = user_id);
create policy "reflections_update_own" on public.reflections for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- User settings (portable prefs only — synced keys whitelisted in app)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  setting_key text not null,
  setting_value text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  unique (user_id, setting_key)
);

create index if not exists user_settings_user_updated_idx on public.user_settings (user_id, updated_at);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert_own" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on public.user_settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
