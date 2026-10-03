import { describe, expect, it } from "vitest";
import { maintainWeek, maxWeeklyMinutes, seasonPlan, seasonWeekFor } from "./periodization";

const ironman = seasonPlan({ goalCreatedOn: "2026-10-03", eventDate: "2027-08-29", racePreset: "ironman", beginner: false });

describe("seasonPlan", () => {
  it("runs from the week the goal was set to race week, without gaps", () => {
    expect(ironman[0].weekStart).toBe("2026-09-28");
    expect(ironman.at(-1)).toMatchObject({ weekStart: "2027-08-23", phase: "race", type: "race" });
    ironman.slice(1).forEach((week, index) => {
      expect(Date.parse(week.weekStart) - Date.parse(ironman[index].weekStart)).toBe(7 * 24 * 3600 * 1000);
    });
  });

  it("ends with 3 taper weeks for an Ironman, after a peak block without recovery week", () => {
    const types = ironman.slice(-7).map((week) => `${week.phase}/${week.type}`);
    expect(types).toEqual(["peak/build", "peak/build", "peak/build", "taper/taper", "taper/taper", "taper/taper", "race/race"]);
  });

  it("builds up over the season, not only within a block", () => {
    const peaks = new Map<number, number>();
    for (const week of ironman) if (week.block > 0) peaks.set(week.block, Math.max(peaks.get(week.block) ?? 0, week.volume));
    const values = [...peaks.values()];
    expect(values[0]).toBeLessThan(0.6); // a year out: start low
    expect(values.at(-1)).toBe(1); // the peak block reaches 100%
    values.slice(1).forEach((value, index) => expect(value).toBeGreaterThan(values[index]));
  });

  it("has a recovery week after every 3 build weeks, lighter and without hard sessions", () => {
    const blocks = ironman.filter((week) => week.block > 1 && week.phase !== "peak");
    for (const week of blocks) {
      expect(week.type).toBe(week.weekInBlock === 4 ? "recovery" : "build");
      if (week.type === "recovery") expect(week.hardSessions).toBe(0);
    }
  });

  it("raises intensity with the phase: base tempo, build threshold, peak everything", () => {
    expect(ironman[0]).toMatchObject({ phase: "base", maxHardDifficulty: 3, hardSessions: 1 });
    expect(ironman.find((week) => week.phase === "build")).toMatchObject({ maxHardDifficulty: 4, hardSessions: 2 });
    expect(ironman.find((week) => week.phase === "peak")?.maxHardDifficulty).toBe(5);
  });

  it("uses blocks of 2 + 1 for beginners and a 2-week taper for a half marathon", () => {
    const half = seasonPlan({ goalCreatedOn: "2026-10-03", eventDate: "2026-12-13", racePreset: "half_marathon", beginner: true });
    // b = build, r = recovery, t = taper; the last letter r is race week.
    expect(half.map((week) => week.type.slice(0, 1)).join("")).toBe("bbrbbrbbttr");
    expect(half.filter((week) => week.phase === "taper")).toHaveLength(2);
    expect(half.find((week) => week.block === 1)?.blockLength).toBe(3);
  });

  it("turns a chosen week into recovery and the block's planned recovery week into a build week", () => {
    const plain = seasonPlan({ goalCreatedOn: "2026-10-03", eventDate: "2027-08-29", racePreset: "ironman", beginner: false });
    const target = plain.find((week) => week.block === 3 && week.weekInBlock === 2)!;
    const moved = seasonPlan({
      goalCreatedOn: "2026-10-03",
      eventDate: "2027-08-29",
      racePreset: "ironman",
      beginner: false,
      recoveryOverrides: [target.weekStart],
    });
    const block = moved.filter((week) => week.block === 3).map((week) => week.type);
    expect(block).toEqual(["build", "recovery", "build", "build"]);
    expect(moved.find((week) => week.weekStart === target.weekStart)!.volume).toBeLessThan(target.volume);
  });
});

describe("without a goal", () => {
  it("keeps a steady 3 + 1 rhythm", () => {
    const types = ["2027-01-04", "2027-01-11", "2027-01-18", "2027-01-25", "2027-02-01"].map((monday) => maintainWeek(monday, false).type);
    expect(types).toEqual(["build", "build", "build", "recovery", "build"]);
    expect(maintainWeek("2027-01-11", false, ["2027-01-11"]).type).toBe("recovery");
    expect(seasonWeekFor("2027-01-04", null, false).phase).toBe("maintain");
  });
});

describe("maxWeeklyMinutes", () => {
  it("gives longer races and higher levels more hours", () => {
    expect(maxWeeklyMinutes(["intermediate"], "run_10k")).toBe(8 * 60);
    expect(maxWeeklyMinutes(["intermediate"], "marathon")).toBe(10 * 60);
    expect(maxWeeklyMinutes(["advanced", "advanced", "advanced"], "ironman")).toBe(16 * 60);
  });

  it("averages the levels, rounded down, and has a default without a goal", () => {
    expect(maxWeeklyMinutes(["beginner", "intermediate", "advanced"], "ironman")).toBe(13 * 60);
    expect(maxWeeklyMinutes(["beginner", "intermediate"], "ironman")).toBe(9 * 60);
    expect(maxWeeklyMinutes(["advanced"], null)).toBe(8 * 60);
    expect(maxWeeklyMinutes([], null)).toBe(4 * 60);
  });
});
