import { describe, expect, it } from "vitest";
import { groupByWeekday, isValidIsoDate, resolveWeekStart } from "./week";

const today = "2026-10-01"; // a Thursday

describe("isValidIsoDate", () => {
  it("accepts real dates and rejects everything else", () => {
    expect(isValidIsoDate("2026-10-01")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true); // leap year
    expect(isValidIsoDate("2026-02-31")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("1-10-2026")).toBe(false);
    expect(isValidIsoDate("<script>")).toBe(false);
  });
});

describe("resolveWeekStart", () => {
  it("shows the current week without a parameter", () => {
    expect(resolveWeekStart(undefined, today)).toBe("2026-09-28");
  });

  it("snaps any date in the URL to its Monday", () => {
    expect(resolveWeekStart("2026-10-08", today)).toBe("2026-10-05");
  });

  it("falls back to the current week for nonsense", () => {
    expect(resolveWeekStart("tomorrow", today)).toBe("2026-09-28");
  });
});

describe("groupByWeekday", () => {
  it("puts each workout on its day and skips other weeks", () => {
    const workouts = [
      { id: "a", scheduled_on: "2026-09-28" }, // Monday
      { id: "b", scheduled_on: "2026-10-01" }, // Thursday
      { id: "c", scheduled_on: "2026-10-01" }, // Thursday
      { id: "d", scheduled_on: "2026-10-05" }, // next week
    ];
    const days = groupByWeekday("2026-09-28", workouts);
    expect(days.map((day) => day.map((workout) => workout.id))).toEqual([
      ["a"],
      [],
      [],
      ["b", "c"],
      [],
      [],
      [],
    ]);
  });
});
