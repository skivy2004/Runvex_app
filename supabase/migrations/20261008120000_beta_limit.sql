-- The beta is limited to 50 accounts. The landing page shows how many spots are
-- left (beta_spots_left, callable by anyone: it only returns a number), and a
-- trigger refuses new accounts once the beta is full, also when someone calls the
-- auth API directly instead of using the register page. Deleting an account
-- frees its spot. To change the limit, replace beta_limit() in a new migration.

create function public.beta_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 50 $$;

-- Only the number, never who signed up.
create function public.beta_spots_left()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(0, public.beta_limit() - (select count(*) from auth.users))::integer
$$;

revoke execute on function public.beta_spots_left() from public;
grant execute on function public.beta_spots_left() to anon, authenticated;

create function public.enforce_beta_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- One signup at a time, so two people can't both take the last spot.
  perform pg_advisory_xact_lock(hashtext('runvex_beta_limit'));
  if (select count(*) from auth.users) >= public.beta_limit() then
    raise exception 'beta_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Only the trigger may run this function, never a user through the API.
revoke execute on function public.enforce_beta_limit() from public, anon, authenticated;

create trigger enforce_beta_limit
  before insert on auth.users
  for each row execute function public.enforce_beta_limit();
