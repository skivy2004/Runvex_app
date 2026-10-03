import { describe, expect, it } from "vitest";
import { callCost, hasBudgetLeft, WEEKLY_AI_BUDGET_USD } from "./budget";

describe("callCost", () => {
  it("prices input, output and cache tokens per million", () => {
    // 6,000 in, 2,000 out on Sonnet 5.5: 6000 × $2 + 2000 × $10 per million = $0.032
    expect(callCost("claude-sonnet-5-5", { inputTokens: 6000, outputTokens: 2000, cacheReadTokens: 0, cacheWriteTokens: 0 })).toBeCloseTo(0.032);
    // Cached input is ten times cheaper to read.
    expect(callCost("claude-sonnet-5-5", { inputTokens: 0, outputTokens: 0, cacheReadTokens: 10_000, cacheWriteTokens: 0 })).toBeCloseTo(0.002);
  });

  it("never prices an unknown model as free", () => {
    expect(callCost("claude-future", { inputTokens: 1000, outputTokens: 1000, cacheReadTokens: 0, cacheWriteTokens: 0 })).toBeGreaterThan(0);
  });
});

describe("hasBudgetLeft", () => {
  it("stops at the weekly budget", () => {
    expect(hasBudgetLeft(0)).toBe(true);
    expect(hasBudgetLeft(WEEKLY_AI_BUDGET_USD - 0.01)).toBe(true);
    expect(hasBudgetLeft(WEEKLY_AI_BUDGET_USD)).toBe(false);
  });
});
