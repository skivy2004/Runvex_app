-- Goal distances: which preset was chosen (e.g. Ironman 70.3) and the
-- distance per sport. Run once in the Supabase SQL Editor.

begin;

alter table public.goals
  -- e.g. 'ironman_70_3', 'marathon' or 'custom'. Null for goals without a distance.
  add column race_preset text check (char_length(race_preset) <= 40),
  -- e.g. [{"sport": "swimming", "distance_m": 1900}, {"sport": "cycling", "distance_m": 90000}]
  -- Distances are always stored in meters; the app converts them for display.
  add column segments jsonb not null default '[]'::jsonb
    check (jsonb_typeof(segments) = 'array');

-- Same function as before, now also saving race_preset and segments.
-- CREATE OR REPLACE keeps the existing permissions (grant/revoke).
create or replace function public.complete_onboarding(
  p_display_name text,
  p_date_of_birth date,
  p_work_pattern public.work_pattern,
  -- [{"sport": "running", "level": "beginner"}, ...]
  p_sports jsonb,
  -- [{"weekday": 1, "minutes": 60}, ...] (1 = Monday ... 7 = Sunday)
  p_availability jsonb,
  -- null, or {"description": "...", "sports": ["running"], "event_name": "...",
  --           "event_date": "2027-06-01", "race_preset": "marathon",
  --           "segments": [{"sport": "running", "distance_m": 42195}]}
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

  if exists (
    select 1 from public.profiles
    where id = v_user_id and onboarding_completed_at is not null
  ) then
    raise exception 'Onboarding already completed';
  end if;

  -- In the Netherlands (GDPR / AVG) users must be at least 16 to consent themselves.
  if p_date_of_birth > current_date - interval '16 years' then
    raise exception 'User must be at least 16 years old';
  end if;

  if jsonb_array_length(p_sports) = 0 then
    raise exception 'At least one sport is required';
  end if;

  update public.profiles
  set
    display_name = nullif(trim(p_display_name), ''),
    date_of_birth = p_date_of_birth,
    work_pattern = p_work_pattern,
    onboarding_completed_at = now()
  where id = v_user_id;

  insert into public.athlete_sports (user_id, sport, level)
  select
    v_user_id,
    (item ->> 'sport')::public.sport,
    (item ->> 'level')::public.experience_level
  from jsonb_array_elements(p_sports) as item;

  insert into public.weekly_availability (user_id, weekday, available_minutes)
  select
    v_user_id,
    (item ->> 'weekday')::smallint,
    (item ->> 'minutes')::smallint
  from jsonb_array_elements(p_availability) as item
  on conflict (user_id, weekday)
    do update set available_minutes = excluded.available_minutes;

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
