-- FitShift initial schema
-- Run once in the Supabase SQL Editor. Everything is wrapped in a transaction:
-- if one statement fails, nothing is created.

begin;

-------------------------------------------------------------------------------
-- Enum types: fixed lists of allowed values
-------------------------------------------------------------------------------

create type public.sport as enum ('running', 'cycling', 'swimming', 'strength');
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');
create type public.work_pattern as enum ('fixed', 'variable', 'shifts');
create type public.app_locale as enum ('en', 'nl');

-------------------------------------------------------------------------------
-- Helper: keep updated_at current on every update
-------------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-------------------------------------------------------------------------------
-- profiles: one row per user, created automatically on sign-up
-------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  locale public.app_locale not null default 'en',
  timezone text not null default 'Europe/Amsterdam',
  work_pattern public.work_pattern,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- athlete_sports: which sports a user does, with a level per sport
-------------------------------------------------------------------------------

create table public.athlete_sports (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sport public.sport not null,
  level public.experience_level not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, sport)
);

create trigger athlete_sports_set_updated_at
  before update on public.athlete_sports
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- goals: what the user trains for, optionally an event with a date
-------------------------------------------------------------------------------

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 500),
  -- A triathlon goal is simply {swimming, cycling, running}.
  sports public.sport[] not null default '{}',
  event_name text check (char_length(event_name) <= 120),
  event_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_id_idx on public.goals (user_id);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- weekly_availability: the user's default week, minutes available per weekday
-- 0 minutes = not available that day.
-------------------------------------------------------------------------------

create table public.weekly_availability (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- ISO weekday: 1 = Monday ... 7 = Sunday
  weekday smallint not null check (weekday between 1 and 7),
  available_minutes smallint not null default 0 check (available_minutes between 0 and 1440),
  updated_at timestamptz not null default now(),
  primary key (user_id, weekday)
);

create trigger weekly_availability_set_updated_at
  before update on public.weekly_availability
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- planned_workouts: trainings the user plans and can drag between days
-------------------------------------------------------------------------------

create table public.planned_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  scheduled_on date not null,
  sport public.sport not null,
  title text not null check (char_length(title) between 1 and 120),
  duration_minutes smallint not null check (duration_minutes between 5 and 1440),
  notes text check (char_length(notes) <= 2000),
  -- Order of workouts within the same day.
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index planned_workouts_user_date_idx on public.planned_workouts (user_id, scheduled_on);

create trigger planned_workouts_set_updated_at
  before update on public.planned_workouts
  for each row execute function public.set_updated_at();

-------------------------------------------------------------------------------
-- Create a profile automatically when someone signs up
-------------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, locale)
  values (
    new.id,
    -- The sign-up form passes the chosen language as metadata.
    case when new.raw_user_meta_data ->> 'locale' = 'nl'
      then 'nl'::public.app_locale
      else 'en'::public.app_locale
    end
  );
  return new;
end;
$$;

-- Only the trigger may run this function, never a user through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-------------------------------------------------------------------------------
-- Permissions (which operations are allowed at all)
-- Logged-out visitors (anon) get nothing. Logged-in users (authenticated)
-- get only what they need. RLS below then limits them to their own rows.
-------------------------------------------------------------------------------

revoke all on table
  public.profiles,
  public.athlete_sports,
  public.goals,
  public.weekly_availability,
  public.planned_workouts
from anon, authenticated;

-- Profiles are created by the trigger and deleted with the account,
-- so users may only read them and update these columns.
grant select on table public.profiles to authenticated;
grant update (display_name, locale, timezone, work_pattern, onboarding_completed_at)
  on table public.profiles to authenticated;

grant select, insert, update, delete on table
  public.athlete_sports,
  public.goals,
  public.weekly_availability,
  public.planned_workouts
to authenticated;

-------------------------------------------------------------------------------
-- Row Level Security: every user only sees and changes their own rows
-- (select auth.uid()) is wrapped in a subquery so Postgres evaluates it once
-- per query instead of once per row.
-------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.athlete_sports enable row level security;
alter table public.goals enable row level security;
alter table public.weekly_availability enable row level security;
alter table public.planned_workouts enable row level security;

create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users manage own sports"
  on public.athlete_sports for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage own goals"
  on public.goals for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage own availability"
  on public.weekly_availability for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage own workouts"
  on public.planned_workouts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
