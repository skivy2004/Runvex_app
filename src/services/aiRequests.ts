import type { AppSupabaseClient } from "./types";

export type AiRequestKind = "plan_week";

/** How many AI requests of this kind the user made since `since` (an ISO timestamp). */
export async function countAiRequestsSince(
  supabase: AppSupabaseClient,
  userId: string,
  kind: AiRequestKind,
  since: string,
) {
  const { count, error } = await supabase
    .from("ai_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since);
  if (error) throw error;
  return count ?? 0;
}

export async function logAiRequest(supabase: AppSupabaseClient, userId: string, kind: AiRequestKind) {
  const { error } = await supabase.from("ai_requests").insert({ user_id: userId, kind });
  if (error) throw error;
}
