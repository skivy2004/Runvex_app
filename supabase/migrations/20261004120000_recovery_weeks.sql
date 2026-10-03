-- Weeks the athlete turned into a recovery week (e.g. a heavy work week). The
-- training blocks (src/core/periodization.ts) shift around them: the block's
-- planned recovery week becomes a build week. One row per Monday.

create table public.recovery_weeks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

revoke all on table public.recovery_weeks from anon, authenticated;
grant select, insert, delete on table public.recovery_weeks to authenticated;

alter table public.recovery_weeks enable row level security;

create policy "Users manage own recovery weeks"
  on public.recovery_weeks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
