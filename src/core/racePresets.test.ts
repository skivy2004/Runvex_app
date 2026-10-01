import { describe, expect, it } from "vitest";
import { categorySports, MAX_GOAL_DISTANCE_M, parseDistanceInput, racePresets } from "./racePresets";

describe("parseDistanceInput", () => {
  it("reads kilometers with a dot or a Dutch comma", () => {
    expect(parseDistanceInput("running", "21.1")).toBe(21_100);
    expect(parseDistanceInput("running", "21,1")).toBe(21_100);
  });

  it("reads swimming distances in meters", () => {
    expect(parseDistanceInput("swimming", "1900")).toBe(1_900);
  });

  it("rejects empty, zero, negative and non-numeric input", () => {
    for (const text of ["", "  ", "0", "-5", "abc"]) {
      expect(parseDistanceInput("cycling", text)).toBeNull();
    }
  });

  it("rejects distances above the maximum", () => {
    expect(parseDistanceInput("cycling", "1001")).toBeNull();
    expect(parseDistanceInput("cycling", String(MAX_GOAL_DISTANCE_M / 1000))).toBe(MAX_GOAL_DISTANCE_M);
  });
});

describe("racePresets", () => {
  it("has unique keys", () => {
    const keys = racePresets.map((preset) => preset.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has one distance per sport of its category, in race order", () => {
    for (const preset of racePresets) {
      expect(preset.segments.map((segment) => segment.sport)).toEqual(categorySports[preset.category]);
    }
  });
});
