-- The coach team: head coach and run, bike and swim coaches.
--
-- ai_usage: one row per Claude API call with its tokens and cost, so each user
-- stays within a weekly AI budget. Users can read and add their own rows, but
-- not change or delete them, so the budget can't be reset.
--
-- coach_messages: the conversation with the coaches (chat, reactions to
-- trainings). A message can carry a proposal to change trainings, which the
-- user applies or dismisses. Deleted with the account (on delete cascade).

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  agent text not null check (agent in ('head', 'running', 'cycling', 'swimming')),
  purpose text not null check (purpose in ('plan_week', 'feedback', 'chat')),
  model text not null check (char_length(model) <= 64),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cache_read_tokens integer not null default 0 check (cache_read_tokens >= 0),
  cache_write_tokens integer not null default 0 check (cache_write_tokens >= 0),
  cost_usd numeric(10, 6) not null check (cost_usd >= 0),
  created_at timestamptz not null default now()
);

create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at);

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'coach')),
  -- Which coach wrote it (null for the user's own messages).
  agent text check (agent in ('head', 'running', 'cycling', 'swimming')),
  content text not null check (char_length(content) between 1 and 4000),
  -- The training it's about, e.g. a reaction to how a training went.
  workout_id uuid references public.planned_workouts (id) on delete set null,
  -- A proposed change to trainings, applied only when the user agrees.
  proposal jsonb,
  proposal_status text check (proposal_status in ('pending', 'applied', 'dismissed')),
  created_at timestamptz not null default now(),
  check ((proposal is null) = (proposal_status is null))
);

create index coach_messages_user_created_idx on public.coach_messages (user_id, created_at);
-- Deleting a training sets workout_id to null; the index keeps that fast.
create index coach_messages_workout_idx on public.coach_messages (workout_id);

revoke all on table public.ai_usage, public.coach_messages from anon, authenticated;
grant select, insert on table public.ai_usage to authenticated;
grant select, insert, delete on table public.coach_messages to authenticated;
-- Only the status of a proposal can change (applied / dismissed).
grant update (proposal_status) on table public.coach_messages to authenticated;

alter table public.ai_usage enable row level security;
alter table public.coach_messages enable row level security;

create policy "Users can read own AI usage"
  on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add own AI usage"
  on public.ai_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users manage own coach messages"
  on public.coach_messages for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
