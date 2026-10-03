import { describe, expect, it } from "vitest";
import {
  countdownParts,
  doneStreak,
  feedbackTarget,
  hourInTimeZone,
  partOfDay,
  startOfDayInTimeZone,
  weekSportProgress,
} from "./home";

describe("greeting", () => {
  it("picks the part of the day", () => {
    expect(partOfDay(7)).toBe("morning");
    expect(partOfDay(12)).toBe("afternoon");
    expect(partOfDay(18)).toBe("evening");
  });

  it("uses the hour in the user's time zone", () => {
    const now = new Date("2026-10-03T22:30:00Z");
    expect(hourInTimeZone("Europe/Amsterdam", now)).toBe(0);
    expect(hourInTimeZone("UTC", now)).toBe(22);
  });
});

describe("doneStreak", () => {
  const today = "2026-10-03";
  it("counts done trainings in a row, back from today", () => {
    const workouts = [
      { scheduled_on: "2026-09-28", status: "skipped" },
      { scheduled_on: "2026-09-30", status: "done" },
      { scheduled_on: "2026-10-01", status: "done" },
      { scheduled_on: "2026-10-03", status: "planned" }, // today, not done yet: doesn't break it
      { scheduled_on: "2026-10-04", status: "planned" }, // future
    ];
    expect(doneStreak(workouts, today)).toBe(2);
    expect(doneStreak([...workouts, { scheduled_on: today, status: "done" }], today)).toBe(3);
  });

  it("stops at a training you forgot to check off", () => {
    expect(doneStreak([{ scheduled_on: "2026-10-01", status: "done" }, { scheduled_on: "2026-10-02", status: "planned" }], today)).toBe(0);
  });
});

describe("weekSportProgress", () => {
  it("adds up planned and done minutes per sport, swim, bike, run order", () => {
    expect(
      weekSportProgress([
        { sport: "running", duration_minutes: 45, status: "done" },
        { sport: "running", duration_minutes: 60, status: "planned" },
        { sport: "swimming", duration_minutes: 50, status: "skipped" },
      ]),
    ).toEqual([
      { sport: "swimming", plannedMinutes: 50, doneMinutes: 0 },
      { sport: "running", plannedMinutes: 105, doneMinutes: 45 },
    ]);
  });
});

describe("countdown", () => {
  it("finds midnight in the user's time zone, also in summer time", () => {
    expect(new Date(startOfDayInTimeZone("2026-07-11", "Europe/Amsterdam")).toISOString()).toBe("2026-07-10T22:00:00.000Z");
    expect(new Date(startOfDayInTimeZone("2026-12-11", "Europe/Amsterdam")).toISOString()).toBe("2026-12-10T23:00:00.000Z");
  });

  it("splits the time left into days, hours and minutes", () => {
    const now = Date.parse("2026-10-03T10:00:00Z");
    expect(countdownParts(now + (2 * 24 * 60 + 3 * 60 + 5) * 60_000, now)).toEqual({ days: 2, hours: 3, minutes: 5 });
    expect(countdownParts(now - 1000, now)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});

describe("feedbackTarget", () => {
  const today = "2026-10-05";
  const workouts = [
    { id: "old", scheduled_on: "2026-10-01", status: "done" },
    { id: "sat", scheduled_on: "2026-10-03", status: "done" },
    { id: "sun", scheduled_on: "2026-10-04", status: "skipped" },
    { id: "mon", scheduled_on: "2026-10-05", status: "planned" },
    { id: "tue", scheduled_on: "2026-10-06", status: "planned" },
  ];

  it("asks about the latest training up to today without a reaction, skipping skipped ones", () => {
    expect(feedbackTarget(workouts, new Set(), today, "2026-10-03")?.id).toBe("mon");
    expect(feedbackTarget(workouts, new Set(["mon"]), today, "2026-10-03")?.id).toBe("sat");
    expect(feedbackTarget(workouts, new Set(["mon", "sat"]), today, "2026-10-03")).toBeNull();
  });
});
