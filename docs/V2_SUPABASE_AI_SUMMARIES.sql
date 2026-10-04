-- Tin Pata — AI summary cache + per-user daily quota
-- Run once in Supabase SQL Editor after V2_SUPABASE_METADATA_SCHEMA.sql.

create extension if not exists pgcrypto;

create table if not exists public.ai_summary_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  page_start integer not null check (page_start >= 1),
  page_end integer not null check (page_end >= page_start),
  language text not null check (language in ('en', 'bn')),
  summary_length text not null check (summary_length in ('short', 'detailed')),
  source_hash text not null,
  prompt_version text not null,
  model text not null,
  summary_text text not null,
  created_at timestamptz not null default now(),
  unique (user_id, book_id, source_hash, prompt_version)
);

create index if not exists ai_summary_cache_user_book_idx
  on public.ai_summary_cache (user_id, book_id, created_at desc);

alter table public.ai_summary_cache enable row level security;

drop policy if exists "ai_summary_cache_select_own" on public.ai_summary_cache;
create policy "ai_summary_cache_select_own"
  on public.ai_summary_cache for select
  using (auth.uid() = user_id);

drop policy if exists "ai_summary_cache_insert_own" on public.ai_summary_cache;
create policy "ai_summary_cache_insert_own"
  on public.ai_summary_cache for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.books
      where books.id = ai_summary_cache.book_id
        and books.user_id = auth.uid()
        and books.deleted_at is null
    )
  );

create table if not exists public.ai_daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_daily_usage enable row level security;

drop policy if exists "ai_daily_usage_select_own" on public.ai_daily_usage;
create policy "ai_daily_usage_select_own"
  on public.ai_daily_usage for select
  using (auth.uid() = user_id);

-- Cache hits do not call this function and therefore do not use daily quota.
-- The fixed limit cannot be increased by an API caller.
create or replace function public.consume_ai_summary_quota()
returns table (
  allowed boolean,
  used integer,
  daily_limit integer,
  remaining integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  today_utc date := (timezone('utc', now()))::date;
  fixed_limit constant integer := 20;
  next_count integer;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.ai_daily_usage (user_id, usage_date, request_count, updated_at)
  values (current_user_id, today_utc, 1, now())
  on conflict (user_id, usage_date)
  do update
    set request_count = ai_daily_usage.request_count + 1,
        updated_at = now()
    where ai_daily_usage.request_count < fixed_limit
  returning request_count into next_count;

  if next_count is null then
    select request_count
      into next_count
      from public.ai_daily_usage
      where user_id = current_user_id
        and usage_date = today_utc;

    return query select false, coalesce(next_count, fixed_limit),
      fixed_limit, 0;
    return;
  end if;

  return query select true, next_count, fixed_limit,
    greatest(0, fixed_limit - next_count);
end;
$$;

revoke all on function public.consume_ai_summary_quota() from public;
revoke all on function public.consume_ai_summary_quota() from anon;
grant execute on function public.consume_ai_summary_quota() to authenticated;
