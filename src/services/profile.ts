import type { ProfileDetailsData } from "@/core/validation/onboarding";
import type { AppSupabaseClient } from "./types";

/** The logged-in user's profile, or null when nobody is logged in. */
export async function getCurrentProfile(supabase: AppSupabaseClient) {
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, date_of_birth, work_pattern, locale, timezone, onboarding_completed_at")
    .eq("id", userId)
    .single();
  if (error) throw error;

  return data;
}

export async function updateProfileDetails(
  supabase: AppSupabaseClient,
  userId: string,
  details: ProfileDetailsData,
) {
  return supabase
    .from("profiles")
    .update({
      // An empty name is stored as "no name", like during the intake.
      display_name: details.displayName || null,
      date_of_birth: details.dateOfBirth,
    })
    .eq("id", userId);
}
