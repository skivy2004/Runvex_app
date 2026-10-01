-- Redo the intake: a function that replaces the training part of the profile
-- (work pattern, sports, availability and goal) without touching name and
-- date of birth. complete_onboarding now reuses it, so the logic lives in one place.
-- Run once in the Supabase SQL Editor.

begin;

-------------------------------------------------------------------------------
-- save_training_profile: replaces sports, availability and goal in one transaction.
-- SECURITY INVOKER (the default): runs with the caller's rights, so RLS applies.
-------------------------------------------------------------------------------

create function public.save_training_profile(
  p_work_pattern public.work_pattern,
  -- [{"sport": "running", "level": "beginner"}, ...]
  p_sports jsonb,
  -- [{"weekday": 1, "minutes": 60}, ...] (1 = Monday ... 7 = Sunday)
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

  insert into public.weekly_availability (user_id, weekday, available_minutes)
  select
    v_user_id,
    (item ->> 'weekday')::smallint,
    (item ->> 'minutes')::smallint
  from jsonb_array_elements(p_availability) as item
  on conflict (user_id, weekday)
    do update set available_minutes = excluded.available_minutes;

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

revoke execute on function public.save_training_profile from public, anon;
grant execute on function public.save_training_profile to authenticated;

-------------------------------------------------------------------------------
-- complete_onboarding: same signature as before, now built on save_training_profile.
-------------------------------------------------------------------------------

create or replace function public.complete_onboarding(
  p_display_name text,
  p_date_of_birth date,
  p_work_pattern public.work_pattern,
  p_sports jsonb,
  p_availability jsonb,
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

  update public.profiles
  set
    display_name = nullif(trim(p_display_name), ''),
    date_of_birth = p_date_of_birth
  where id = v_user_id;

  perform public.save_training_profile(p_work_pattern, p_sports, p_availability, p_goal);

  update public.profiles
  set onboarding_completed_at = now()
  where id = v_user_id;
end;
$$;

commit;
