import type { AppSupabaseClient } from "./types";

/** The user's sports with their level per sport. */
export async function getAthleteSports(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("athlete_sports")
    .select("sport, level")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data;
}
