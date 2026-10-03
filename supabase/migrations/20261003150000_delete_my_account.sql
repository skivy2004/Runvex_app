-- "Delete my account" (GDPR right to erasure). Deletes the logged-in user from
-- auth.users; every table with user data references it with "on delete cascade",
-- so profile, sports, goals, availability, trainings and the AI log go with it.
-- security definer: runs with the owner's rights, because users can't touch
-- auth.users themselves. It only ever deletes the caller (auth.uid()).

create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
