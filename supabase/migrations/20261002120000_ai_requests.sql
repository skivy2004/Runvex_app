-- A log of AI coach requests per user, so the app can limit how often someone
-- uses the (paid) Claude API, e.g. at most 10 week plans per day.
-- Users can read and add their own rows, but not change or delete them,
-- so the limit can't be reset by deleting the log.

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('plan_week')),
  created_at timestamptz not null default now()
);

create index ai_requests_user_created_idx on public.ai_requests (user_id, created_at);

revoke all on table public.ai_requests from anon, authenticated;
grant select, insert on table public.ai_requests to authenticated;

alter table public.ai_requests enable row level security;

create policy "Users can read own AI requests"
  on public.ai_requests for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can log own AI requests"
  on public.ai_requests for insert to authenticated
  with check ((select auth.uid()) = user_id);
