import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isoWeekday, startOfWeek, todayInTimeZone } from "./dates";

describe("todayInTimeZone", () => {
  it("uses the user's time zone, not UTC", () => {
    // 23:30 UTC on 1 October is already 2 October in Amsterdam (UTC+2 in summer time).
    const now = new Date(Date.UTC(2026, 9, 1, 23, 30));
    expect(todayInTimeZone("Europe/Amsterdam", now)).toBe("2026-10-02");
    expect(todayInTimeZone("UTC", now)).toBe("2026-10-01");
  });
});

describe("addDays", () => {
  it("crosses months and years", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("isn't affected by the switch to summer time", () => {
    // Clocks went forward on 29 March 2026 in the Netherlands.
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
  });
});

describe("weeks", () => {
  it("knows the weekday (1 = Monday)", () => {
    expect(isoWeekday("2026-10-01")).toBe(4); // Thursday
    expect(isoWeekday("2026-10-04")).toBe(7); // Sunday
  });

  it("finds the Monday of the week", () => {
    expect(startOfWeek("2026-10-01")).toBe("2026-09-28");
    expect(startOfWeek("2026-09-28")).toBe("2026-09-28");
    expect(startOfWeek("2026-10-04")).toBe("2026-09-28");
  });
});

describe("daysBetween", () => {
  it("counts the days until an event", () => {
    expect(daysBetween("2026-10-01", "2027-10-03")).toBe(367);
    expect(daysBetween("2026-10-01", "2026-10-01")).toBe(0);
    expect(daysBetween("2026-10-02", "2026-10-01")).toBe(-1);
  });
});
