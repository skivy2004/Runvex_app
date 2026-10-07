import type { ActivitySummary } from "@/core/activities";
import type { AppSupabaseClient } from "./types";

const ACTIVITY_COLUMNS =
  "id, planned_workout_id, sport, started_at, performed_on, duration_seconds, distance_meters, avg_heart_rate, max_heart_rate, avg_power, ascent_meters";

/** Uploaded activities between two days (both included), in order. */
export async function getActivities(supabase: AppSupabaseClient, userId: string, from: string, to: string) {
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_COLUMNS)
    .eq("user_id", userId)
    .gte("performed_on", from)
    .lte("performed_on", to)
    .order("started_at");
  if (error) throw error;
  return data;
}

export type Activity = Awaited<ReturnType<typeof getActivities>>[number];

/** Which of these planned trainings already have an upload linked. */
export async function linkedPlannedWorkouts(supabase: AppSupabaseClient, userId: string, plannedIds: string[]) {
  if (plannedIds.length === 0) return new Set<string>();
  const { data, error } = await supabase
    .from("activities")
    .select("planned_workout_id")
    .eq("user_id", userId)
    .in("planned_workout_id", plannedIds);
  if (error) throw error;
  return new Set(data.flatMap((row) => (row.planned_workout_id ? [row.planned_workout_id] : [])));
}

/**
 * Saves one activity. Heart rate only with consent (it's health data); without it,
 * those fields stay empty. Uploading the same activity again changes nothing.
 */
export async function insertActivity(
  supabase: AppSupabaseClient,
  userId: string,
  activity: ActivitySummary & { performedOn: string; plannedWorkoutId: string | null },
  withHeartRate: boolean,
) {
  return supabase
    .from("activities")
    .insert({
      user_id: userId,
      planned_workout_id: activity.plannedWorkoutId,
      sport: activity.sport,
      started_at: activity.startedAt.toISOString(),
      performed_on: activity.performedOn,
      duration_seconds: activity.durationSeconds,
      distance_meters: activity.distanceMeters,
      avg_heart_rate: withHeartRate ? activity.avgHeartRate : null,
      max_heart_rate: withHeartRate ? activity.maxHeartRate : null,
      avg_power: activity.avgPower,
      ascent_meters: activity.ascentMeters,
    })
    .select("id")
    .single();
}

export async function deleteActivity(supabase: AppSupabaseClient, userId: string, id: string) {
  return supabase.from("activities").delete().eq("user_id", userId).eq("id", id);
}

/**
 * Consent for heart rate: given now, or withdrawn. Withdrawing also deletes the
 * heart rate already stored (GDPR: consent can be withdrawn at any time).
 */
export async function setHealthConsent(supabase: AppSupabaseClient, userId: string, on: boolean) {
  const profile = await supabase
    .from("profiles")
    .update({ health_consent_at: on ? new Date().toISOString() : null })
    .eq("id", userId);
  if (profile.error || on) return profile;
  return supabase.from("activities").update({ avg_heart_rate: null, max_heart_rate: null }).eq("user_id", userId);
}
