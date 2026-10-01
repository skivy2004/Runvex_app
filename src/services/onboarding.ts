import type { OnboardingData } from "@/core/validation/onboarding";
import type { AppSupabaseClient } from "./types";

/**
 * Saves all intake answers through the complete_onboarding database function,
 * which stores everything in one transaction.
 */
export async function saveOnboarding(supabase: AppSupabaseClient, data: OnboardingData) {
  const { goal } = data;

  return supabase.rpc("complete_onboarding", {
    p_display_name: data.displayName,
    p_date_of_birth: data.dateOfBirth,
    p_work_pattern: data.workPattern,
    p_sports: data.sports,
    p_availability: data.availability,
    p_goal: goal
      ? {
          description: goal.description,
          sports: goal.sports,
          event_name: goal.eventName,
          event_date: goal.eventDate,
          race_preset: goal.racePreset,
          segments: goal.segments.map((segment) => ({
            sport: segment.sport,
            distance_m: segment.distanceMeters,
          })),
        }
      : undefined,
  });
}
