import type { AppSupabaseClient } from "./types";

/** The logged-in user's profile, or null when nobody is logged in. */
export async function getCurrentProfile(supabase: AppSupabaseClient) {
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, locale, onboarding_completed_at")
    .eq("id", userId)
    .single();
  if (error) throw error;

  return data;
}
