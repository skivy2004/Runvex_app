-- Long sessions: which weekday is for the long run and/or the long ride.
-- Stored per day as a list of sports, e.g. Saturday = {cycling}, Sunday = {running}.
-- Run once in the Supabase SQL Editor (after 20261001230000_availability_sports.sql).

begin;

alter table public.weekly_availability
  add column long_sessions public.sport[] not null default '{}',
  -- A rest day can't hold a long session.
  add constraint weekly_availability_long_sessions_need_time
    check (available_minutes > 0 or cardinality(long_sessions) = 0);

-- Same function as before; the availability part now also saves long_sessions.
create or replace function public.save_training_profile(
  p_work_pattern public.work_pattern,
  -- [{"sport": "running", "level": "beginner"}, ...]
  p_sports jsonb,
  -- [{"weekday": 1, "minutes": 60, "sports": ["running"], "long_sessions": ["running"]}, ...]
  p_availability jsonb,
  -- null = no goal, or {"description": ..., "sports": [...], "event_name": ...,
  --   "event_date": ..., "race_preset": ..., "segments": [...]}
  p_goal jsonb default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if jsonb_array_length(p_sports) = 0 then
    raise exception 'At least one sport is required';
  end if;

  update public.profiles
  set work_pattern = p_work_pattern
  where id = v_user_id;

  -- Replace the sports: remove the old list, insert the new one.
  delete from public.athlete_sports where user_id = v_user_id;
  insert into public.athlete_sports (user_id, sport, level)
  select
    v_user_id,
    (item ->> 'sport')::public.sport,
    (item ->> 'level')::public.experience_level
  from jsonb_array_elements(p_sports) as item;

  insert into public.weekly_availability (
    user_id, weekday, available_minutes, sports, long_sessions
  )
  select
    v_user_id,
    (item ->> 'weekday')::smallint,
    (item ->> 'minutes')::smallint,
    array(
      select jsonb_array_elements_text(coalesce(item -> 'sports', '[]'::jsonb))
    )::public.sport[],
    array(
      select jsonb_array_elements_text(coalesce(item -> 'long_sessions', '[]'::jsonb))
    )::public.sport[]
  from jsonb_array_elements(p_availability) as item
  on conflict (user_id, weekday)
    do update set
      available_minutes = excluded.available_minutes,
      sports = excluded.sports,
      long_sessions = excluded.long_sessions;

  -- The new goal replaces the old one.
  delete from public.goals where user_id = v_user_id;
  if p_goal is not null then
    insert into public.goals (
      user_id, description, sports, event_name, event_date, race_preset, segments
    )
    values (
      v_user_id,
      p_goal ->> 'description',
      array(select jsonb_array_elements_text(p_goal -> 'sports'))::public.sport[],
      nullif(trim(p_goal ->> 'event_name'), ''),
      (p_goal ->> 'event_date')::date,
      p_goal ->> 'race_preset',
      coalesce(p_goal -> 'segments', '[]'::jsonb)
    );
  end if;
end;
$$;

commit;
