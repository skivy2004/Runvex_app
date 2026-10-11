-- Agent hub: messages from agents (Hermes, later Claude Code and Codex) on /admin,
-- an email to the admin for every new message, and automatic AI-cost alerts.
--
-- How it fits together:
-- - Everything lives in the ops schema, which the Supabase API does not expose.
-- - Each agent has its own key (made on /admin, stored here only as a SHA-256 hash).
--   Agents call the public.agent_* functions below with that key; they can post
--   messages, read the counts-only daily report and read messages addressed to
--   them. Nothing else: no email addresses, no user data.
-- - Only admins (public.admins) can read all messages and manage keys, through
--   the public.admin_* functions.
-- - New messages to the admin are emailed through Resend (pg_net). Without the
--   Vault secret "resend_api_key" nothing is sent and the hub still works.
-- - Every AI call (public.ai_usage) checks the budgets and posts an alert once
--   when a limit is crossed.
--
-- Messages are shown as plain text, never as HTML: agents read things from the
-- internet (mail, forums), so their text may contain injected content.

create extension if not exists pg_net with schema extensions;

/* ---------- Tables ---------- */

create table ops.agents (
  name text primary key check (name ~ '^[a-z0-9-]{2,32}$' and name not in ('jeremy', 'runvex')),
  -- SHA-256 (hex) of the agent's key; null means the key was revoked.
  key_hash text unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table ops.agent_messages (
  id bigint generated always as identity primary key,
  -- An agent name, 'runvex' (the database itself, for alerts) or 'jeremy' (the admin).
  from_agent text not null,
  to_agent text not null default 'jeremy',
  kind text not null check (kind in ('report', 'mail_summary', 'marketing_draft', 'alert', 'chat', 'note')),
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 8000),
  -- Replies point to the first message of the conversation.
  thread_id bigint references ops.agent_messages (id) on delete cascade,
  -- new/read for everything; approved/rejected for marketing drafts; done = archived.
  status text not null default 'new' check (status in ('new', 'read', 'approved', 'rejected', 'done')),
  created_at timestamptz not null default now(),
  emailed_at timestamptz
);

create index agent_messages_to_created on ops.agent_messages (to_agent, created_at desc);
create index agent_messages_thread on ops.agent_messages (thread_id);

-- Small key/value settings: AI budgets and the email sender.
create table ops.settings (
  key text primary key,
  value jsonb not null
);

insert into ops.settings (key, value) values
  -- Alert at 80% and 100% of this monthly Claude spend.
  ('monthly_ai_budget_usd', '20'),
  -- Prepaid Anthropic credit: amount topped up and since when. Alert at 80% and 95% used.
  ('ai_credit', '{"amount_usd": null, "since": null}'),
  -- Resend's test sender works without your own domain, but only to the Resend account's own address.
  ('email_from', '"Runvex Agents <onboarding@resend.dev>"');

-- Which alerts were already sent, so each one goes out once.
create table ops.alert_log (
  key text primary key,
  created_at timestamptz not null default now()
);

alter table ops.agents enable row level security;
alter table ops.agent_messages enable row level security;
alter table ops.settings enable row level security;
alter table ops.alert_log enable row level security;

/* ---------- Helpers (not callable from outside) ---------- */

create function ops.hash_key(p_key text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex');
$$;

-- The agent that owns this key, or an error. Also notes when it was last seen.
create function ops.agent_for_key(p_key text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  update ops.agents a set last_seen_at = now()
  where a.key_hash is not null and a.key_hash = ops.hash_key(p_key)
  returning a.name into v_name;

  if v_name is null then
    raise exception 'invalid_agent_key' using errcode = '28000';
  end if;
  return v_name;
end;
$$;

-- Posts a message from the database itself ('runvex'), once per p_once_key.
create function ops.raise_alert(p_once_key text, p_severity text, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into ops.alert_log (key) values (p_once_key) on conflict do nothing;
  if found then
    insert into ops.agent_messages (from_agent, kind, severity, title, body)
    values ('runvex', 'alert', p_severity, p_title, p_body);
  end if;
end;
$$;

/* ---------- Email to the admin (Resend via pg_net) ---------- */

-- One email per insert statement, so a batch of marketing drafts is one email.
create function ops.email_new_messages()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_api_key text;
  v_to jsonb;
  v_count int;
  v_subject text;
  v_text text;
begin
  select count(*) into v_count from new_rows where to_agent = 'jeremy';
  if v_count = 0 then
    return null;
  end if;

  select s.decrypted_secret into v_api_key from vault.decrypted_secrets s where s.name = 'resend_api_key';
  select jsonb_agg(u.email) into v_to from public.admins a join auth.users u on u.id = a.user_id where u.email is not null;
  if v_api_key is null or v_to is null then
    return null;
  end if;

  if v_count = 1 then
    select format('[Runvex] %s%s', case when severity <> 'info' then '⚠️ ' else '' end, title)
    into v_subject from new_rows where to_agent = 'jeremy';
  else
    select format('[Runvex] %s nieuwe berichten van %s', v_count, string_agg(distinct from_agent, ', '))
    into v_subject from new_rows where to_agent = 'jeremy';
  end if;

  -- Mail summaries are about your own inbox: the email only says one is ready,
  -- so their content doesn't travel through yet another service.
  select string_agg(
    format(
      E'— %s · %s\n%s\n%s',
      upper(r.kind), r.from_agent, r.title,
      case when r.kind = 'mail_summary' then 'Bekijk de samenvatting op /admin.' else left(r.body, 1500) end
    ),
    E'\n\n' order by r.id
  ) || E'\n\nAlles bekijken: https://runvex.app/admin'
  into v_text from new_rows r where r.to_agent = 'jeremy';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_api_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', (select s.value #>> '{}' from ops.settings s where s.key = 'email_from'),
      'to', v_to,
      'subject', left(v_subject, 200),
      'text', v_text
    )
  );

  update ops.agent_messages m set emailed_at = now()
  where m.id in (select id from new_rows where to_agent = 'jeremy');
  return null;
exception when others then
  -- A failing email must never block a message.
  raise warning 'email_new_messages failed: %', sqlerrm;
  return null;
end;
$$;

create trigger email_new_messages
after insert on ops.agent_messages
referencing new table as new_rows
for each statement execute function ops.email_new_messages();

/* ---------- AI-cost alerts (checked on every AI call) ---------- */

create function ops.check_ai_alerts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now_local timestamp := now() at time zone 'Europe/Amsterdam';
  v_month_start timestamptz := date_trunc('month', v_now_local) at time zone 'Europe/Amsterdam';
  v_week_start timestamptz := date_trunc('week', v_now_local) at time zone 'Europe/Amsterdam';
  v_day_start timestamptz := date_trunc('day', v_now_local) at time zone 'Europe/Amsterdam';
  v_month_label text := to_char(v_now_local, 'YYYY-MM');
  v_budget numeric;
  v_month numeric;
  v_day numeric;
  v_user_week numeric;
  v_credit jsonb;
  v_credit_amount numeric;
  v_credit_spent numeric;
begin
  select (s.value #>> '{}')::numeric into v_budget from ops.settings s where s.key = 'monthly_ai_budget_usd';
  select coalesce(sum(u.cost_usd), 0) into v_month from public.ai_usage u where u.created_at >= v_month_start;

  if v_budget > 0 and v_month >= v_budget then
    perform ops.raise_alert('ai_month_100:' || v_month_label, 'critical', 'AI-budget deze maand op',
      format('Claude-kosten deze maand: $%s van je budget $%s.', round(v_month, 2), v_budget));
  elsif v_budget > 0 and v_month >= 0.8 * v_budget then
    perform ops.raise_alert('ai_month_80:' || v_month_label, 'warning', 'AI-budget deze maand 80%',
      format('Claude-kosten deze maand: $%s van je budget $%s.', round(v_month, 2), v_budget));
  end if;

  select coalesce(sum(u.cost_usd), 0) into v_day from public.ai_usage u where u.created_at >= v_day_start;
  if v_day > 1 then
    perform ops.raise_alert('ai_day:' || to_char(v_now_local, 'YYYY-MM-DD'), 'warning', 'Hoge AI-kosten vandaag',
      format('Vandaag al $%s aan Claude-calls (grens $1).', round(v_day, 2)));
  end if;

  -- Weekly budget per user is $0.65 (web/src/core/coach/budget.ts). No user id in the message.
  select coalesce(sum(u.cost_usd), 0) into v_user_week from public.ai_usage u
  where u.user_id = new.user_id and u.created_at >= v_week_start;
  if v_user_week >= 0.8 * 0.65 then
    perform ops.raise_alert('ai_user_80:' || to_char(v_now_local, 'IYYY-IW') || ':' || new.user_id, 'info',
      'Gebruiker boven 80% van weekbudget',
      format('Een gebruiker zit deze week op $%s van $0,65.', round(v_user_week, 2)));
  end if;

  select s.value into v_credit from ops.settings s where s.key = 'ai_credit';
  v_credit_amount := (v_credit ->> 'amount_usd')::numeric;
  if v_credit_amount > 0 and v_credit ->> 'since' is not null then
    select coalesce(sum(u.cost_usd), 0) into v_credit_spent from public.ai_usage u
    where u.created_at >= (v_credit ->> 'since')::timestamptz;
    if v_credit_spent >= 0.95 * v_credit_amount then
      perform ops.raise_alert('ai_credit_95:' || (v_credit ->> 'since'), 'critical', 'Anthropic-tegoed bijna op',
        format('Sinds je opwaardering $%s van $%s gebruikt. Waardeer op in de Anthropic Console.', round(v_credit_spent, 2), v_credit_amount));
    elsif v_credit_spent >= 0.8 * v_credit_amount then
      perform ops.raise_alert('ai_credit_80:' || (v_credit ->> 'since'), 'warning', 'Anthropic-tegoed 80% gebruikt',
        format('Sinds je opwaardering $%s van $%s gebruikt.', round(v_credit_spent, 2), v_credit_amount));
    end if;
  end if;

  return null;
exception when others then
  -- An alert problem must never block logging an AI call.
  raise warning 'check_ai_alerts failed: %', sqlerrm;
  return null;
end;
$$;

create trigger check_ai_alerts
after insert on public.ai_usage
for each row execute function ops.check_ai_alerts();

/* ---------- Daily report: now with waitlist counts ---------- */

create or replace function ops.daily_report(
  report_day date default ((now() at time zone 'Europe/Amsterdam')::date - 1)
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with bounds as (
    select (report_day::timestamp at time zone 'Europe/Amsterdam') as day_start,
           ((report_day + 1)::timestamp at time zone 'Europe/Amsterdam') as day_end,
           (date_trunc('week', report_day::timestamp) at time zone 'Europe/Amsterdam') as week_start,
           (date_trunc('month', report_day::timestamp) at time zone 'Europe/Amsterdam') as month_start
  ),
  week_cost as (
    select u.user_id, sum(u.cost_usd) as cost
    from public.ai_usage u, bounds b
    where u.created_at >= b.week_start and u.created_at < b.day_end
    group by u.user_id
  ),
  activity as (
    select user_id, created_at as at from public.coach_messages
    union all select user_id, updated_at from public.planned_workouts
    union all select user_id, created_at from public.activities
  )
  select jsonb_build_object(
    'day', report_day,
    'users_total', (select count(*) from auth.users),
    'signups', (select count(*) from auth.users x, bounds b where x.created_at >= b.day_start and x.created_at < b.day_end),
    'onboarding_completed', (select count(*) from public.profiles p, bounds b where p.onboarding_completed_at >= b.day_start and p.onboarding_completed_at < b.day_end),
    'active_users', (select count(distinct a.user_id) from activity a, bounds b where a.at >= b.day_start and a.at < b.day_end),
    'users_who_planned', (select count(distinct w.user_id) from public.planned_workouts w, bounds b where w.created_at >= b.day_start and w.created_at < b.day_end),
    'trainings_done', (select count(*) from public.planned_workouts w, bounds b where w.status = 'done' and w.updated_at >= b.day_start and w.updated_at < b.day_end),
    'trainings_skipped', (select count(*) from public.planned_workouts w, bounds b where w.status = 'skipped' and w.updated_at >= b.day_start and w.updated_at < b.day_end),
    'coach_messages_from_users', (select count(*) from public.coach_messages m, bounds b where m.role = 'user' and m.created_at >= b.day_start and m.created_at < b.day_end),
    'fit_uploads', (select count(*) from public.activities a, bounds b where a.created_at >= b.day_start and a.created_at < b.day_end),
    'ai_calls', (select count(*) from public.ai_usage u, bounds b where u.created_at >= b.day_start and u.created_at < b.day_end),
    'ai_cost_usd_day', (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u, bounds b where u.created_at >= b.day_start and u.created_at < b.day_end),
    'ai_cost_usd_month', (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u, bounds b where u.created_at >= b.month_start and u.created_at < b.day_end),
    'max_user_ai_cost_usd_this_week', (select coalesce(max(cost), 0) from week_cost),
    -- Weekly AI budget per user is $0.65 (web/src/core/coach/budget.ts).
    'users_over_80pct_weekly_ai_budget', (select count(*) from week_cost where cost >= 0.8 * 0.65),
    -- Waitlist: counts only, never the addresses.
    'waitlist_total', (select count(*) from public.waitlist w, bounds b where w.created_at < b.day_end),
    'waitlist_new', (select count(*) from public.waitlist w, bounds b where w.created_at >= b.day_start and w.created_at < b.day_end),
    'waitlist_new_with_news_consent', (select count(*) from public.waitlist w, bounds b where w.news_consent_at is not null and w.created_at >= b.day_start and w.created_at < b.day_end),
    'waitlist_new_by_source', coalesce((
      select jsonb_object_agg(s.source, s.n) from (
        select coalesce(w.source, 'direct') as source, count(*) as n
        from public.waitlist w, bounds b where w.created_at >= b.day_start and w.created_at < b.day_end
        group by 1
      ) s
    ), '{}'::jsonb)
  );
$$;

/* ---------- For agents (called with their key) ---------- */

-- Post 1-20 messages: [{kind, title, body?, severity?, to?, thread_id?}, ...].
-- Returns the new ids. Max 200 messages per agent per day.
create function public.agent_post_messages(p_key text, p_messages jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agent text := ops.agent_for_key(p_key);
  v_ids jsonb;
begin
  if jsonb_typeof(p_messages) <> 'array' or jsonb_array_length(p_messages) not between 1 and 20 then
    raise exception 'messages_must_be_array_of_1_to_20' using errcode = '22023';
  end if;
  if (select count(*) from ops.agent_messages m where m.from_agent = v_agent and m.created_at > now() - interval '1 day')
     + jsonb_array_length(p_messages) > 200 then
    raise exception 'daily_limit_reached' using errcode = '54000';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_messages) e
    where coalesce(e ->> 'to', 'jeremy') <> 'jeremy'
      and not exists (select 1 from ops.agents a where a.name = e ->> 'to')
  ) then
    raise exception 'unknown_recipient' using errcode = '22023';
  end if;

  with inserted as (
    insert into ops.agent_messages (from_agent, to_agent, kind, severity, title, body, thread_id)
    select v_agent,
           coalesce(e ->> 'to', 'jeremy'),
           e ->> 'kind',
           coalesce(e ->> 'severity', 'info'),
           e ->> 'title',
           coalesce(e ->> 'body', ''),
           (e ->> 'thread_id')::bigint
    from jsonb_array_elements(p_messages) e
    returning id
  )
  select jsonb_agg(id order by id) into v_ids from inserted;
  return v_ids;
end;
$$;

-- The counts-only daily report (yesterday by default).
create function public.agent_report(p_key text, p_day date default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform ops.agent_for_key(p_key);
  if p_day is null then
    return ops.daily_report();
  end if;
  return ops.daily_report(p_day);
end;
$$;

-- Messages to this agent since p_since, plus what the admin decided about the
-- agent's own marketing drafts (so it learns what works).
create function public.agent_inbox(p_key text, p_since timestamptz default now() - interval '7 days')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_agent text := ops.agent_for_key(p_key);
begin
  return jsonb_build_object(
    'agent', v_agent,
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'from', m.from_agent, 'kind', m.kind, 'title', m.title, 'body', m.body,
        'thread_id', m.thread_id, 'created_at', m.created_at
      ) order by m.id)
      from ops.agent_messages m where m.to_agent = v_agent and m.created_at >= p_since
    ), '[]'::jsonb),
    'draft_decisions', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'title', m.title, 'status', m.status) order by m.id)
      from ops.agent_messages m
      where m.from_agent = v_agent and m.kind = 'marketing_draft' and m.status in ('approved', 'rejected')
        and m.created_at >= p_since
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.agent_post_messages(text, jsonb) from public;
revoke execute on function public.agent_report(text, date) from public;
revoke execute on function public.agent_inbox(text, timestamptz) from public;
grant execute on function public.agent_post_messages(text, jsonb) to anon, authenticated;
grant execute on function public.agent_report(text, date) to anon, authenticated;
grant execute on function public.agent_inbox(text, timestamptz) to anon, authenticated;

/* ---------- For the admin page ---------- */

create function ops.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
end;
$$;

-- Everything the hub tab shows: last 300 messages, the agents and the budgets.
create function public.admin_hub()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_credit jsonb;
begin
  perform ops.require_admin();
  select s.value into v_credit from ops.settings s where s.key = 'ai_credit';

  return jsonb_build_object(
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'from', m.from_agent, 'to', m.to_agent, 'kind', m.kind, 'severity', m.severity,
        'title', m.title, 'body', m.body, 'thread_id', m.thread_id, 'status', m.status,
        'created_at', m.created_at, 'emailed', m.emailed_at is not null
      ) order by m.id desc)
      from (select * from ops.agent_messages order by id desc limit 300) m
    ), '[]'::jsonb),
    'agents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', a.name, 'active', a.key_hash is not null, 'created_at', a.created_at, 'last_seen_at', a.last_seen_at
      ) order by a.name)
      from ops.agents a
    ), '[]'::jsonb),
    'monthly_ai_budget_usd', (select (s.value #>> '{}')::numeric from ops.settings s where s.key = 'monthly_ai_budget_usd'),
    'ai_credit_usd', (v_credit ->> 'amount_usd')::numeric,
    'ai_credit_since', v_credit ->> 'since',
    'ai_credit_spent_usd', case when v_credit ->> 'since' is null then null else (
      select coalesce(sum(u.cost_usd), 0) from public.ai_usage u where u.created_at >= (v_credit ->> 'since')::timestamptz
    ) end,
    'email_ready', exists (select 1 from vault.decrypted_secrets s where s.name = 'resend_api_key')
  );
end;
$$;

create function public.admin_set_message_status(p_id bigint, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform ops.require_admin();
  update ops.agent_messages set status = p_status where id = p_id;
end;
$$;

-- Marks every new message (not drafts) as read.
create function public.admin_mark_all_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform ops.require_admin();
  update ops.agent_messages set status = 'read'
  where status = 'new' and to_agent = 'jeremy' and kind <> 'marketing_draft';
end;
$$;

-- A message from the admin to an agent (e.g. an answer in a conversation).
create function public.admin_post_message(p_to_agent text, p_body text, p_thread_id bigint default null)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  perform ops.require_admin();
  if not exists (select 1 from ops.agents a where a.name = p_to_agent) then
    raise exception 'unknown_agent' using errcode = '22023';
  end if;
  insert into ops.agent_messages (from_agent, to_agent, kind, title, body, thread_id)
  values ('jeremy', p_to_agent, 'chat', left(coalesce(nullif(split_part(trim(p_body), E'\n', 1), ''), 'Bericht'), 200), p_body, p_thread_id)
  returning id into v_id;
  return v_id;
end;
$$;

-- Makes (or replaces) an agent's key and returns it ONCE; only the hash is kept.
create function public.admin_create_agent_key(p_name text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text := 'rvx_' || encode(extensions.gen_random_bytes(32), 'hex');
begin
  perform ops.require_admin();
  insert into ops.agents (name, key_hash) values (lower(trim(p_name)), ops.hash_key(v_key))
  on conflict (name) do update set key_hash = excluded.key_hash;
  return v_key;
end;
$$;

create function public.admin_revoke_agent_key(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform ops.require_admin();
  update ops.agents set key_hash = null where name = p_name;
end;
$$;

-- Monthly budget and (optionally) a new top-up of prepaid credit, counted from now.
create function public.admin_set_ai_budget(p_monthly_budget_usd numeric, p_credit_topup_usd numeric default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform ops.require_admin();
  if p_monthly_budget_usd is not null and p_monthly_budget_usd >= 0 then
    update ops.settings set value = to_jsonb(p_monthly_budget_usd) where key = 'monthly_ai_budget_usd';
  end if;
  if p_credit_topup_usd is not null and p_credit_topup_usd > 0 then
    update ops.settings set value = jsonb_build_object('amount_usd', p_credit_topup_usd, 'since', now())
    where key = 'ai_credit';
  end if;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.admin_hub()',
    'public.admin_set_message_status(bigint, text)',
    'public.admin_mark_all_read()',
    'public.admin_post_message(text, text, bigint)',
    'public.admin_create_agent_key(text)',
    'public.admin_revoke_agent_key(text)',
    'public.admin_set_ai_budget(numeric, numeric)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;

-- Internal helpers: nobody calls these directly.
revoke execute on function ops.hash_key(text) from public;
revoke execute on function ops.agent_for_key(text) from public;
revoke execute on function ops.raise_alert(text, text, text, text) from public;
revoke execute on function ops.require_admin() from public;

-- To turn on email (run yourself in the SQL Editor, with your own Resend key):
-- select vault.create_secret('re_JOUW_RESEND_KEY', 'resend_api_key');
