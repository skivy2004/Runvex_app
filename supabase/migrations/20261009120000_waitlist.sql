-- Waitlist: before the App Store launch, visitors leave only their email address
-- to hear when Runvex launches. Nobody can read the list through the API (RLS on,
-- no policies); people join only through join_waitlist(), which never reveals
-- whether an address was already on the list.
--
-- Registration is closed during this phase: beta_limit() becomes 0, so the
-- existing trigger refuses every new account. Existing accounts keep working.

create table public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique,
  locale text not null default 'en' check (locale in ('en', 'nl')),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
revoke all on public.waitlist from anon, authenticated;

create function public.join_waitlist(p_email text, p_locale text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  -- Already on the list: do nothing, and answer exactly the same.
  insert into public.waitlist (email, locale)
  values (v_email, case when p_locale in ('en', 'nl') then p_locale else 'en' end)
  on conflict (email) do nothing;
end;
$$;

revoke execute on function public.join_waitlist(text, text) from public;
grant execute on function public.join_waitlist(text, text) to anon, authenticated;

-- Close registration (see 20261008120000_beta_limit.sql). To reopen, replace
-- beta_limit() again with the number of accounts allowed.
create or replace function public.beta_limit()
returns integer
language sql
immutable
set search_path = ''
as $$ select 0 $$;
