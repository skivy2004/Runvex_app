import { describe, expect, it } from "vitest";
import { isAtLeastAge, latestDateOfBirthForAge } from "./age";

// A fixed "today" keeps these tests from breaking as time passes.
const today = new Date(2026, 9, 1); // 1 October 2026 (months start at 0)

describe("isAtLeastAge", () => {
  it("accepts someone who turns 16 today", () => {
    expect(isAtLeastAge("2010-10-01", 16, today)).toBe(true);
  });

  it("rejects someone who turns 16 tomorrow", () => {
    expect(isAtLeastAge("2010-10-02", 16, today)).toBe(false);
  });

  it("accepts someone much older", () => {
    expect(isAtLeastAge("1985-03-15", 16, today)).toBe(true);
  });
});

describe("latestDateOfBirthForAge", () => {
  it("returns the date exactly 16 years ago", () => {
    expect(latestDateOfBirthForAge(16, today)).toBe("2010-10-01");
  });
});
