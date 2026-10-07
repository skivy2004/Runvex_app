-- Trainings you actually did, read from a .FIT file you upload (e.g. exported from
-- Garmin Connect). Only a summary is kept: sport, start, duration, distance and,
-- with your consent, heart rate. The file itself and its GPS track are never stored.
-- An activity is linked to the planned training of that day and sport, if any.

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  planned_workout_id uuid references public.planned_workouts (id) on delete set null,
  source text not null default 'fit' check (source in ('fit')),
  sport public.sport not null,
  started_at timestamptz not null,
  -- The day in the athlete's own time zone, for the week view and matching.
  performed_on date not null,
  duration_seconds integer not null check (duration_seconds between 60 and 86400),
  distance_meters integer check (distance_meters between 0 and 1000000),
  -- Heart rate is health data (GDPR art. 9): only stored with consent (profiles.health_consent_at).
  avg_heart_rate smallint check (avg_heart_rate between 20 and 250),
  max_heart_rate smallint check (max_heart_rate between 20 and 250),
  avg_power smallint check (avg_power between 0 and 3000),
  ascent_meters integer check (ascent_meters between 0 and 20000),
  created_at timestamptz not null default now(),
  -- The same activity uploaded twice is the same row.
  unique (user_id, started_at, sport)
);

create index activities_user_day_idx on public.activities (user_id, performed_on);
-- One activity per planned training.
create unique index activities_planned_workout_idx on public.activities (planned_workout_id)
  where planned_workout_id is not null;

revoke all on table public.activities from anon, authenticated;
grant select, insert, update, delete on table public.activities to authenticated;

alter table public.activities enable row level security;

create policy "Users manage own activities"
  on public.activities for all to authenticated
  using ((select auth.uid()) = user_id)
  -- Only linked to your own planned trainings, never to someone else's.
  with check (
    (select auth.uid()) = user_id
    and (
      planned_workout_id is null
      or exists (
        select 1 from public.planned_workouts p
        where p.id = planned_workout_id and p.user_id = (select auth.uid())
      )
    )
  );

-- When you agreed that Runvex stores heart rate from your trainings. Null = no consent.
alter table public.profiles add column health_consent_at timestamptz;
grant update (health_consent_at) on table public.profiles to authenticated;
