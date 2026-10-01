import type { OnboardingData, TrainingProfileData } from "@/core/validation/onboarding";
import { toAvailabilityRows } from "./availability";
import type { AppSupabaseClient } from "./types";

/** The goal in the JSON shape the database functions expect. */
function toGoalJson(goal: TrainingProfileData["goal"]) {
  if (!goal) return undefined;
  return {
    description: goal.description,
    sports: goal.sports,
    event_name: goal.eventName,
    event_date: goal.eventDate,
    race_preset: goal.racePreset,
    segments: goal.segments.map((segment) => ({
      sport: segment.sport,
      distance_m: segment.distanceMeters,
    })),
  };
}

/**
 * Saves the first intake through the complete_onboarding database function,
 * which stores everything in one transaction.
 */
export async function saveOnboarding(supabase: AppSupabaseClient, data: OnboardingData) {
  return supabase.rpc("complete_onboarding", {
    p_display_name: data.displayName,
    p_date_of_birth: data.dateOfBirth,
    p_work_pattern: data.workPattern,
    p_sports: data.sports,
    p_availability: toAvailabilityRows(data.availability),
    p_goal: toGoalJson(data.goal),
  });
}

/** Replaces sports, availability, work pattern and goal (redoing the intake). */
export async function saveTrainingProfile(supabase: AppSupabaseClient, data: TrainingProfileData) {
  return supabase.rpc("save_training_profile", {
    p_work_pattern: data.workPattern,
    p_sports: data.sports,
    p_availability: toAvailabilityRows(data.availability),
    p_goal: toGoalJson(data.goal),
  });
}
