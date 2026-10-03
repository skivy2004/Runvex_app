import type { PlannedSession } from "@/core/planner";
import type { Sport } from "@/core/training";
import type { AppSupabaseClient } from "./types";

const WORKOUT_COLUMNS = "id, scheduled_on, sport, title, duration_minutes, position, template_id, notes";

/** Planned workouts between two dates (both included), in order. */
export async function getPlannedWorkouts(
  supabase: AppSupabaseClient,
  userId: string,
  from: string,
  to: string,
) {
  const { data, error } = await supabase
    .from("planned_workouts")
    .select(WORKOUT_COLUMNS)
    .eq("user_id", userId)
    .gte("scheduled_on", from)
    .lte("scheduled_on", to)
    .order("scheduled_on")
    .order("position");
  if (error) throw error;
  return data;
}

/** The first workout on or after `from`, or null when nothing is planned. */
export async function getNextWorkout(supabase: AppSupabaseClient, userId: string, from: string) {
  const { data, error } = await supabase
    .from("planned_workouts")
    .select(WORKOUT_COLUMNS)
    .eq("user_id", userId)
    .gte("scheduled_on", from)
    .order("scheduled_on")
    .order("position")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type PlannedWorkout = NonNullable<Awaited<ReturnType<typeof getNextWorkout>>>;

/** Saves the sessions of a new plan. `title` is the workout name, `notes` the coach's reason. */
export async function insertPlannedSessions(
  supabase: AppSupabaseClient,
  userId: string,
  sessions: (PlannedSession & { title: string; notes: string | null })[],
) {
  return supabase.from("planned_workouts").insert(
    sessions.map((session) => ({
      user_id: userId,
      scheduled_on: session.scheduledOn,
      sport: session.sport,
      template_id: session.templateId,
      title: session.title,
      duration_minutes: session.durationMinutes,
      notes: session.notes,
    })),
  )
    // Return the new rows, e.g. to send them to the watch.
    .select(WORKOUT_COLUMNS);
}

/** One planned workout of the user, or null when it doesn't exist (or isn't theirs: RLS). */
export async function getPlannedWorkout(supabase: AppSupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase
    .from("planned_workouts")
    .select(WORKOUT_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** The position after the last workout on this day, so a new or moved workout goes last. */
async function nextPosition(supabase: AppSupabaseClient, userId: string, date: string) {
  const { data, error } = await supabase
    .from("planned_workouts")
    .select("position")
    .eq("user_id", userId)
    .eq("scheduled_on", date)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? data.position + 1 : 0;
}

export async function addPlannedWorkout(
  supabase: AppSupabaseClient,
  userId: string,
  workout: {
    date: string;
    sport: Sport;
    templateId: string | null;
    title: string;
    durationMinutes: number;
  },
) {
  const position = await nextPosition(supabase, userId, workout.date);
  return supabase
    .from("planned_workouts")
    .insert({
      user_id: userId,
      scheduled_on: workout.date,
      sport: workout.sport,
      template_id: workout.templateId,
      title: workout.title,
      duration_minutes: workout.durationMinutes,
      position,
    })
    // Return the new row, e.g. to send it to the watch.
    .select(WORKOUT_COLUMNS)
    .single();
}

export async function movePlannedWorkout(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  date: string,
) {
  const position = await nextPosition(supabase, userId, date);
  return supabase
    .from("planned_workouts")
    .update({ scheduled_on: date, position })
    .eq("user_id", userId)
    .eq("id", id);
}

/** Replaces the workout by another library workout. The coach's reason no longer applies. */
export async function swapPlannedWorkout(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  replacement: { templateId: string; title: string; durationMinutes: number },
) {
  return supabase
    .from("planned_workouts")
    .update({
      template_id: replacement.templateId,
      title: replacement.title,
      duration_minutes: replacement.durationMinutes,
      notes: null,
    })
    .eq("user_id", userId)
    .eq("id", id);
}

export async function deletePlannedWorkout(supabase: AppSupabaseClient, userId: string, id: string) {
  return supabase.from("planned_workouts").delete().eq("user_id", userId).eq("id", id);
}

/** Changes which workout a training is, keeping its notes (e.g. the same swim in another pool). */
export async function changePlannedTemplate(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  replacement: { templateId: string; title: string; durationMinutes: number },
) {
  return supabase
    .from("planned_workouts")
    .update({
      template_id: replacement.templateId,
      title: replacement.title,
      duration_minutes: replacement.durationMinutes,
    })
    .eq("user_id", userId)
    .eq("id", id);
}
