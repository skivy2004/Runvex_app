-- Checking off trainings: done or skipped, and for a done training how hard it
-- felt (RPE 1-10) and an optional note. Existing trainings become "planned".
-- The existing grants and RLS policies on planned_workouts (own rows only)
-- cover the new columns.

alter table public.planned_workouts
  add column status text not null default 'planned'
    check (status in ('planned', 'done', 'skipped')),
  add column rpe smallint check (rpe between 1 and 10),
  add column feedback_note text check (char_length(feedback_note) <= 500),
  -- RPE and a note only make sense for a training you actually did.
  add constraint planned_workouts_feedback_needs_done
    check (status = 'done' or (rpe is null and feedback_note is null));
