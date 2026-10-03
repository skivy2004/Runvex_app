-- Swim settings per user: the length of the pool you swim in and the equipment
-- you own. The planner only builds swim trainings that fit your pool and gear.
-- Existing users get a 25 m pool and no equipment until they change it.
-- The existing RLS policies on profiles (own row only) cover the new columns.

alter table public.profiles
  add column pool_length smallint not null default 25
    check (pool_length in (25, 50)),
  add column swim_equipment text[] not null default '{}'
    check (swim_equipment <@ array['fins', 'pull_buoy', 'paddles', 'snorkel', 'kickboard']);

-- Users may change these two settings on their own profile.
grant update (pool_length, swim_equipment) on table public.profiles to authenticated;
