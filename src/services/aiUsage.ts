import type { AgentId } from "@/core/coach/agents";
import type { TokenUsage } from "@/core/coach/budget";
import type { AppSupabaseClient } from "./types";

export type AiPurpose = "plan_week" | "feedback" | "chat";

/** The AI cost of this user since `since` (an ISO timestamp), in US dollars. */
export async function aiSpentSince(supabase: AppSupabaseClient, userId: string, since: string): Promise<number> {
  const { data, error } = await supabase
    .from("ai_usage")
    .select("cost_usd")
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) throw error;
  return data.reduce((total, row) => total + Number(row.cost_usd), 0);
}

/** Saves the tokens and cost of one API call. */
export async function logAiUsage(
  supabase: AppSupabaseClient,
  userId: string,
  call: { agent: AgentId; purpose: AiPurpose; model: string; usage: TokenUsage; costUsd: number },
) {
  const { error } = await supabase.from("ai_usage").insert({
    user_id: userId,
    agent: call.agent,
    purpose: call.purpose,
    model: call.model,
    input_tokens: call.usage.inputTokens,
    output_tokens: call.usage.outputTokens,
    cache_read_tokens: call.usage.cacheReadTokens,
    cache_write_tokens: call.usage.cacheWriteTokens,
    // Rounded to the column's 6 decimals.
    cost_usd: Math.round(call.costUsd * 1_000_000) / 1_000_000,
  });
  if (error) throw error;
}
