import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { agentSystemPrompt, type AgentId } from "@/core/coach/agents";
import { callCost, COACH_MODEL, hasBudgetLeft, type TokenUsage } from "@/core/coach/budget";
import { aiSpentSince, logAiUsage, type AiPurpose } from "./aiUsage";
import type { AppSupabaseClient } from "./types";

// The only place that talks to the Claude API. Every coach call goes through here:
// it checks the user's weekly AI budget first, and saves the tokens and cost of
// every call afterwards. "server-only" makes the build fail if this file ever
// ends up in browser code, so the API key can't leak there.

export function isAiCoachConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type CoachCall = {
  supabase: AppSupabaseClient;
  userId: string;
  agent: AgentId;
  purpose: AiPurpose;
  /** Start of the budget week (Monday 00:00 in the user's time zone), as an ISO timestamp. */
  budgetSince: string;
  /** The conversation so far; the last message is the user's. */
  messages: Anthropic.MessageParam[];
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
};

/** "budget": this week's AI budget is used up. "unavailable": no key, API error or unusable answer. */
export type CoachResult<T> = { status: "ok"; output: T } | { status: "budget" } | { status: "unavailable" };

function usageOf(response: Anthropic.Message): TokenUsage {
  return {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
  };
}

/** Saves the cost of a call. A failed save is logged, but never loses the answer. */
async function recordUsage(call: CoachCall, response: Anthropic.Message) {
  const usage = usageOf(response);
  try {
    await logAiUsage(call.supabase, call.userId, {
      agent: call.agent,
      purpose: call.purpose,
      model: response.model,
      usage,
      costUsd: callCost(response.model, usage),
    });
  } catch (error) {
    console.error("Saving AI usage failed:", error);
  }
}

/** Runs one coach call: budget check, the call itself and the usage log. */
async function run<T>(call: CoachCall, send: (client: Anthropic) => Promise<{ response: Anthropic.Message; output: T | null }>): Promise<CoachResult<T>> {
  if (!isAiCoachConfigured()) return { status: "unavailable" };
  try {
    if (!hasBudgetLeft(await aiSpentSince(call.supabase, call.userId, call.budgetSince))) return { status: "budget" };
    // Reads ANTHROPIC_API_KEY from the environment. One retry, and give up after a
    // minute so the user isn't left waiting.
    const client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
    const { response, output } = await send(client);
    await recordUsage(call, response);
    if (response.stop_reason !== "end_turn" || output === null) {
      console.error(`Coach ${call.agent} (${call.purpose}): unusable answer, stop reason`, response.stop_reason);
      return { status: "unavailable" };
    }
    return { status: "ok", output };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error(`Coach ${call.agent} (${call.purpose}): API error`, error.status, error.message);
    } else {
      console.error(`Coach ${call.agent} (${call.purpose}) failed:`, error);
    }
    return { status: "unavailable" };
  }
}

/** Asks a coach for an answer in a fixed shape (checked against the schema). */
export function askCoachStructured<T>(call: CoachCall, schema: z.ZodType<T>): Promise<CoachResult<T>> {
  return run(call, async (client) => {
    const response = await client.messages.parse({
      model: COACH_MODEL,
      max_tokens: call.maxTokens ?? 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: call.effort ?? "medium", format: zodOutputFormat(schema) },
      system: agentSystemPrompt(call.agent),
      messages: call.messages,
    });
    return { response, output: (response.parsed_output as T | null) ?? null };
  });
}

/** Asks a coach for a written answer, e.g. a reaction or a chat reply. */
export function askCoachText(call: CoachCall): Promise<CoachResult<string>> {
  return run(call, async (client) => {
    const response = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: call.maxTokens ?? 4000,
      thinking: { type: "adaptive" },
      output_config: { effort: call.effort ?? "low" },
      system: agentSystemPrompt(call.agent),
      messages: call.messages,
    });
    const text = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    return { response, output: text || null };
  });
}
