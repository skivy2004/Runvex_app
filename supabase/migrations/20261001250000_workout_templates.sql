-- Planned workouts can come from the workout library (src/core/workouts/data).
-- template_id is the id of that library workout, e.g. "run_45_3_tempo".
-- It stays null for trainings the user adds by hand.
-- The existing table grants and RLS policies cover the new column too.

alter table public.planned_workouts
  add column template_id text
    check (template_id ~ '^(run|bike|swim)_[a-z0-9_]+$' and char_length(template_id) <= 64);
