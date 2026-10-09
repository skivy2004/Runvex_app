import type { AppSupabaseClient } from "./types";

/**
 * How many beta spots are left (only a number, callable when logged out).
 * Null when it can't be read: then the page simply doesn't show it, and the
 * database still refuses signups once the beta is full.
 */
export async function getBetaSpotsLeft(supabase: AppSupabaseClient): Promise<number | null> {
  const { data, error } = await supabase.rpc("beta_spots_left");
  if (error) {
    console.error("Reading beta spots failed:", error.message);
    return null;
  }
  return data;
}
