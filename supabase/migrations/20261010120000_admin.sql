-- Admin dashboard (/admin): an overview of the waitlist, accounts and AI costs.
--
-- Who is admin lives in public.admins. Nobody can read or change that table
-- through the API (RLS on, no policies): you add yourself once in the SQL Editor
-- (see the last line). The page only talks to the two functions below, and
-- admin_overview() refuses everyone who is not in public.admins.
--
-- Run once in Supabase: Dashboard -> SQL Editor -> paste -> Run.

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- True when the logged-in user is an admin. Used to show the page at all.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Everything the dashboard shows, in one call. Counts and totals only, plus the
-- waitlist addresses (the admin owns that list). No trainings or health data.
create function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Amsterdam')::date;
  v_week_ago timestamptz := now() - interval '7 days';
  v_month_start timestamptz := date_trunc('month', now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users_total', (select count(*) from auth.users),
    'users_onboarded', (select count(*) from public.profiles p where p.onboarding_completed_at is not null),
    'signups_7d', (select count(*) from auth.users u where u.created_at >= v_week_ago),
    'active_users_7d', (
      select count(distinct x.user_id) from (
        select user_id from public.coach_messages where created_at >= v_week_ago
        union all select user_id from public.planned_workouts where updated_at >= v_week_ago
        union all select user_id from public.activities where created_at >= v_week_ago
      ) x
    ),
    'trainings_done_7d', (select count(*) from public.planned_workouts w where w.status = 'done' and w.updated_at >= v_week_ago),
    'fit_uploads_7d', (select count(*) from public.activities a where a.created_at >= v_week_ago),
    'coach_messages_7d', (select count(*) from public.coach_messages m where m.role = 'user' and m.created_at >= v_week_ago),

    'waitlist_total', (select count(*) from public.waitlist),
    'waitlist_7d', (select count(*) from public.waitlist w where w.created_at >= v_week_ago),
    'waitlist_nl', (select count(*) from public.waitlist w where w.locale = 'nl'),
    'waitlist_recent', coalesce((
      select jsonb_agg(jsonb_build_object('email', r.email, 'locale', r.locale, 'created_at', r.created_at) order by r.created_at desc)
      from (select * from public.waitlist order by created_at desc limit 100) r
    ), '[]'::jsonb),

    -- New waitlist entries and accounts per day, last 14 days (oldest first).
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'waitlist', (select count(*) from public.waitlist w where (w.created_at at time zone 'Europe/Amsterdam')::date = d.day),
        'signups', (select count(*) from auth.users u where (u.created_at at time zone 'Europe/Amsterdam')::date = d.day)
      ) order by d.day)
      from (select generate_series(v_today - 13, v_today, interval '1 day')::date as day) d
    ),

    'ai_cost_today', (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u where (u.created_at at time zone 'Europe/Amsterdam')::date = v_today),
    'ai_cost_month', (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u where u.created_at >= v_month_start),
    'ai_calls_month', (select count(*) from public.ai_usage u where u.created_at >= v_month_start),
    'ai_by_purpose', coalesce((
      select jsonb_agg(jsonb_build_object('purpose', p.purpose, 'calls', p.calls, 'cost', p.cost) order by p.cost desc)
      from (
        select u.purpose, count(*) as calls, sum(u.cost_usd) as cost
        from public.ai_usage u where u.created_at >= v_month_start group by u.purpose
      ) p
    ), '[]'::jsonb),
    -- Weekly AI budget per user is $0.65 (web/src/core/coach/budget.ts).
    'ai_users_over_80pct', (
      select count(*) from (
        select u.user_id from public.ai_usage u
        where u.created_at >= date_trunc('week', now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
        group by u.user_id having sum(u.cost_usd) >= 0.8 * 0.65
      ) o
    )
  );
end;
$$;

revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

-- Last step, run separately with your own login email:
-- insert into public.admins (user_id) select id from auth.users where email = 'JOUW-EMAIL';
