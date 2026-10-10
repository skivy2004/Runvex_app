-- Waitlist: where people come from, a promo code, and consent for news.
--
-- - source: which link brought someone, e.g. "card-marathon" from a QR code on a
--   business card (?ref=card-marathon). Lets us see which channel works.
-- - promo_code: a code from a card or post (?code=START30), so we know at launch
--   who was promised something.
-- - news_consent_at: when someone ticked "send me news now and then". Empty means
--   no consent: then we email only once, at launch, and delete the address after.
--   The timestamp is also our proof of consent (GDPR / Telecommunicatiewet).
--
-- A bad source or code never blocks joining: it is simply not stored.
--
-- Run once in Supabase: Dashboard -> SQL Editor -> paste -> Run.

alter table public.waitlist
  add column source text check (source ~ '^[a-z0-9-]{1,40}$'),
  add column promo_code text check (promo_code ~ '^[A-Z0-9-]{1,20}$'),
  add column news_consent_at timestamptz;

-- The old two-argument version is replaced by one with three extra (optional) arguments.
drop function public.join_waitlist(text, text);

create function public.join_waitlist(
  p_email text,
  p_locale text,
  p_source text default null,
  p_promo_code text default null,
  p_news boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_source text := lower(trim(p_source));
  v_code text := upper(trim(p_promo_code));
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if v_source !~ '^[a-z0-9-]{1,40}$' then v_source := null; end if;
  if v_code !~ '^[A-Z0-9-]{1,20}$' then v_code := null; end if;

  -- Already on the list: keep the first source and code, but do record news
  -- consent given now. The answer is exactly the same either way, so nobody can
  -- find out whether an address was already on the list.
  insert into public.waitlist (email, locale, source, promo_code, news_consent_at)
  values (
    v_email,
    case when p_locale in ('en', 'nl') then p_locale else 'en' end,
    v_source,
    v_code,
    case when p_news then now() end
  )
  on conflict (email) do update set
    source = coalesce(public.waitlist.source, excluded.source),
    promo_code = coalesce(public.waitlist.promo_code, excluded.promo_code),
    news_consent_at = coalesce(public.waitlist.news_consent_at, excluded.news_consent_at);
end;
$$;

revoke execute on function public.join_waitlist(text, text, text, text, boolean) from public;
grant execute on function public.join_waitlist(text, text, text, text, boolean) to anon, authenticated;
