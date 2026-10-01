-- Availability per day: which sports you want to do that day, and a time range
-- of 30 minutes to 6 hours (0 = rest day). Run once in the Supabase SQL Editor.

begin;

alter table public.weekly_availability
  -- Empty = flexible: any sport is fine that day.
  add column sports public.sport[] not null default '{}',
  add constraint weekly_availability_minutes_range
    check (available_minutes = 0 or available_minutes between 30 and 360);

-- Same function as before; the availability part now also saves the sports per day.
-- CREATE OR REPLACE keeps the existing permissions (grant/revoke).
create or replace function public.save_training_profile(
  p_work_pattern public.work_pattern,
  -- [{"sport": "running", "level": "beginner"}, ...]
  p_sports jsonb,
  -- [{"weekday": 1, "minutes": 60, "sports": ["running"]}, ...] (1 = Monday ... 7 = Sunday)
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

  insert into public.weekly_availability (user_id, weekday, available_minutes, sports)
  select
    v_user_id,
    (item ->> 'weekday')::smallint,
    (item ->> 'minutes')::smallint,
    array(
      select jsonb_array_elements_text(coalesce(item -> 'sports', '[]'::jsonb))
    )::public.sport[]
  from jsonb_array_elements(p_availability) as item
  on conflict (user_id, weekday)
    do update set
      available_minutes = excluded.available_minutes,
      sports = excluded.sports;

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
