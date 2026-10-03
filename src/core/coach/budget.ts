import { startOfWeek } from "@/core/dates";
import { startOfDayInTimeZone } from "@/core/home";

// What the AI coaches cost, and the weekly budget per user. Pure logic, no API calls.
//
// Business rule: €10 a month per user, of which at most €2.50 goes to the AI.
// Spread over the weeks, so nobody uses a whole month in one day: about €0.58
// (≈ $0.65) per week, starting again every Monday.

/** The model every coach uses. */
export const COACH_MODEL = "claude-sonnet-5-5";

/** AI budget per user per week, in US dollars (the API bills in dollars). */
export const WEEKLY_AI_BUDGET_USD = 0.65;

/** Prices in US dollars per million tokens (Claude API price list). */
type Prices = { input: number; output: number; cacheRead: number; cacheWrite: number };

const prices: Record<string, Prices> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-sonnet-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

/**
 * The cost of one API call in dollars. An unknown model is priced like the most
 * expensive one we know, so the budget never undercounts.
 */
export function callCost(model: string, usage: TokenUsage): number {
  const price = prices[model] ?? Object.values(prices).reduce((a, b) => (a.output >= b.output ? a : b));
  const cost =
    usage.inputTokens * price.input +
    usage.outputTokens * price.output +
    usage.cacheReadTokens * price.cacheRead +
    usage.cacheWriteTokens * price.cacheWrite;
  return cost / 1_000_000;
}

/** True while the user has budget left this week. */
export function hasBudgetLeft(spentThisWeekUsd: number): boolean {
  return spentThisWeekUsd < WEEKLY_AI_BUDGET_USD;
}

/** When this budget week started: Monday 00:00 in the user's time zone, as an ISO timestamp. */
export function budgetWeekStart(today: string, timeZone: string): string {
  return new Date(startOfDayInTimeZone(startOfWeek(today), timeZone)).toISOString();
}
