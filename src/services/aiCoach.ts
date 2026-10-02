import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { aiPlanAnswerSchema, PLAN_SYSTEM_PROMPT, type AiPlanAnswer } from "@/core/aiPlan";

// The only place that talks to the Claude API. "server-only" makes the build fail
// if this file ever ends up in browser code, so the API key can't leak there.

const MODEL = "claude-sonnet-5";

export function isAiCoachConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Asks Claude to plan the week. Returns null when the coach isn't available
 * (no key, network or API error, refusal); the caller then uses the rule-based planner.
 */
export async function requestAiPlan(weekMessage: string): Promise<AiPlanAnswer | null> {
  if (!isAiCoachConfigured()) return null;
  // Reads ANTHROPIC_API_KEY from the environment. One retry, and give up after a
  // minute so the user isn't left waiting.
  const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: zodOutputFormat(aiPlanAnswerSchema) },
      system: PLAN_SYSTEM_PROMPT,
      messages: [{ role: "user", content: weekMessage }],
    });
    if (response.stop_reason !== "end_turn" || !response.parsed_output) {
      console.error("AI week plan: unusable answer, stop reason", response.stop_reason);
      return null;
    }
    return response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("AI week plan: API error", error.status, error.message);
    } else {
      console.error("AI week plan failed:", error);
    }
    return null;
  }
}
