-- Tin Pata — AI usage telemetry (v2.2A)
-- Run once in the Supabase SQL Editor. Independent of V2_SUPABASE_AI_SUMMARIES.sql.
--
-- Purpose: understand cost, debug failures, and measure feature usage.
--
-- PRIVACY: this table stores token counts and outcomes only. It must never hold the
-- selected passage, any PDF content, or the generated explanation. The Edge Function
-- (supabase/functions/ai-reading-assistant) inserts exactly the columns below.

create extension if not exists pgcrypto;

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('explain_text')),
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  -- 'ok' or an AIErrorCode ('rate_limited', 'provider_unavailable', ...).
  status text not null,
  latency_ms integer not null default 0 check (latency_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_created_idx
  on public.ai_usage_events (user_id, created_at desc);

alter table public.ai_usage_events enable row level security;

-- A user may read their own usage (no UI consumes this in v2.2A).
drop policy if exists "ai_usage_events_select_own" on public.ai_usage_events;
create policy "ai_usage_events_select_own"
  on public.ai_usage_events for select
  using (auth.uid() = user_id);

-- The Edge Function inserts with the caller's own JWT, so a row can only ever be
-- attributed to the authenticated user. No service-role key is involved.
drop policy if exists "ai_usage_events_insert_own" on public.ai_usage_events;
create policy "ai_usage_events_insert_own"
  on public.ai_usage_events for insert
  with check (auth.uid() = user_id);

-- Rows are write-once telemetry: no update or delete policy is granted.

-- Optional: cost review query.
-- select date_trunc('day', created_at) as day,
--        model,
--        count(*) filter (where status = 'ok') as ok,
--        count(*) filter (where status <> 'ok') as failed,
--        sum(input_tokens) as input_tokens,
--        sum(output_tokens) as output_tokens,
--        round(avg(latency_ms)) as avg_latency_ms
--   from public.ai_usage_events
--  group by 1, 2
--  order by 1 desc;
