-- Tin Pata v2.0A — Supabase setup draft
-- Run in Supabase SQL Editor. Replace nothing — use your project dashboard for URL/keys.
-- NEVER put service_role key in the mobile app.
--
-- Auth dashboard (required for Tin Pata):
-- Authentication → Providers → Email → turn OFF "Confirm email"
-- Tin Pata does not use email confirmation; sign-up signs in immediately.

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can insert their own profile row
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Users can update their own profile row
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup (server-side trigger)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
