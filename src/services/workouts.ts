import type { PlannedSession } from "@/core/planner";
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
  );
}
