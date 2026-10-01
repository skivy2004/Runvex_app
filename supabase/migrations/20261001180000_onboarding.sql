-- Onboarding: date of birth on profiles + one function that saves the whole intake.
-- Run once in the Supabase SQL Editor.

begin;

-------------------------------------------------------------------------------
-- Date of birth (used later for age-based training advice, e.g. heart rate zones)
-------------------------------------------------------------------------------

alter table public.profiles
  add column date_of_birth date check (date_of_birth >= '1900-01-01');

grant update (date_of_birth) on table public.profiles to authenticated;

-------------------------------------------------------------------------------
-- complete_onboarding: saves all intake answers in a single transaction,
-- so either everything is stored or nothing is.
--
-- SECURITY INVOKER (the default) means it runs with the rights of the user
-- who calls it, so all RLS policies still apply.
-------------------------------------------------------------------------------

create function public.complete_onboarding(
  p_display_name text,
  p_date_of_birth date,
  p_work_pattern public.work_pattern,
  -- [{"sport": "running", "level": "beginner"}, ...]
  p_sports jsonb,
  -- [{"weekday": 1, "minutes": 60}, ...] (1 = Monday ... 7 = Sunday)
  p_availability jsonb,
  -- null, or {"description": "...", "sports": ["running"], "event_name": "...", "event_date": "2027-06-01"}
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
    insert into public.goals (user_id, description, sports, event_name, event_date)
    values (
      v_user_id,
      p_goal ->> 'description',
      array(select jsonb_array_elements_text(p_goal -> 'sports'))::public.sport[],
      nullif(trim(p_goal ->> 'event_name'), ''),
      (p_goal ->> 'event_date')::date
    );
  end if;
end;
$$;

-- Only logged-in users may call it.
revoke execute on function public.complete_onboarding from public, anon;
grant execute on function public.complete_onboarding to authenticated;

commit;
