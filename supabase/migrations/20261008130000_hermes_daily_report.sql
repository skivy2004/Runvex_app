-- Hermes setup: a read-only report for the daily check (instructions in daily-report.md).
--
-- Hermes gets its own database role that can do exactly one thing: call
-- ops.daily_report(), which returns only counts and totals. No names, no email
-- addresses, no trainings, no health data, and no way to change anything.
-- The ops schema is not exposed through the Supabase API, only through a direct
-- database connection with this role.
--
-- Run once in Supabase: Dashboard -> SQL Editor -> paste -> Run.
-- Then set the password yourself (see the last line), never in this file.

create schema if not exists ops;
revoke all on schema ops from public;

create or replace function ops.daily_report(
  report_day date default ((now() at time zone 'Europe/Amsterdam')::date - 1)
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select (report_day::timestamp at time zone 'Europe/Amsterdam') as day_start,
           ((report_day + 1)::timestamp at time zone 'Europe/Amsterdam') as day_end,
           (date_trunc('week', report_day::timestamp) at time zone 'Europe/Amsterdam') as week_start,
           (date_trunc('month', report_day::timestamp) at time zone 'Europe/Amsterdam') as month_start
  ),
  week_cost as (
    select u.user_id, sum(u.cost_usd) as cost
    from public.ai_usage u, bounds b
    where u.created_at >= b.week_start and u.created_at < b.day_end
    group by u.user_id
  ),
  activity as (
    select user_id, created_at as at from public.coach_messages
    union all select user_id, updated_at from public.planned_workouts
    union all select user_id, created_at from public.activities
  )
  select jsonb_build_object(
    'day', report_day,
    'users_total', (select count(*) from auth.users),
    'signups', (select count(*) from auth.users x, bounds b where x.created_at >= b.day_start and x.created_at < b.day_end),
    'onboarding_completed', (select count(*) from public.profiles p, bounds b where p.onboarding_completed_at >= b.day_start and p.onboarding_completed_at < b.day_end),
    'active_users', (select count(distinct a.user_id) from activity a, bounds b where a.at >= b.day_start and a.at < b.day_end),
    'users_who_planned', (select count(distinct w.user_id) from public.planned_workouts w, bounds b where w.created_at >= b.day_start and w.created_at < b.day_end),
    'trainings_done', (select count(*) from public.planned_workouts w, bounds b where w.status = 'done' and w.updated_at >= b.day_start and w.updated_at < b.day_end),
    'trainings_skipped', (select count(*) from public.planned_workouts w, bounds b where w.status = 'skipped' and w.updated_at >= b.day_start and w.updated_at < b.day_end),
    'coach_messages_from_users', (select count(*) from public.coach_messages m, bounds b where m.role = 'user' and m.created_at >= b.day_start and m.created_at < b.day_end),
    'fit_uploads', (select count(*) from public.activities a, bounds b where a.created_at >= b.day_start and a.created_at < b.day_end),
    'ai_calls', (select count(*) from public.ai_usage u, bounds b where u.created_at >= b.day_start and u.created_at < b.day_end),
    'ai_cost_usd_day', (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u, bounds b where u.created_at >= b.day_start and u.created_at < b.day_end),
    'ai_cost_usd_month', (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u, bounds b where u.created_at >= b.month_start and u.created_at < b.day_end),
    'max_user_ai_cost_usd_this_week', (select coalesce(max(cost), 0) from week_cost),
    -- Weekly AI budget per user is $0.65 (web/src/core/coach/budget.ts).
    'users_over_80pct_weekly_ai_budget', (select count(*) from week_cost where cost >= 0.8 * 0.65)
  );
$$;

revoke execute on function ops.daily_report(date) from public, anon, authenticated;

-- The role Hermes logs in with. It can only call the report.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'hermes_reader') then
    create role hermes_reader nologin;
  end if;
end
$$;
grant usage on schema ops to hermes_reader;
grant execute on function ops.daily_report(date) to hermes_reader;

-- Last step, run separately with your own strong password (keep it in a password manager):
-- alter role hermes_reader with login password 'HIER-EEN-STERK-WACHTWOORD';
