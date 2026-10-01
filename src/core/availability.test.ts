import { describe, expect, it } from "vitest";
import {
  dayAllowsSport,
  emptyWeek,
  isValidDayMinutes,
  longSessionDay,
  MAX_SLIDER_POSITION,
  missingLongSessions,
  minutesToSliderPosition,
  normalizeDay,
  setLongSessionDay,
  sliderPositionToMinutes,
  type DayAvailability,
} from "./availability";

describe("long sessions", () => {
  const day = (minutes: number, sports: DayAvailability["sports"] = []): DayAvailability => ({
    minutes,
    sports,
    longSessions: [],
  });

  it("allows a sport on flexible days and days that chose it", () => {
    expect(dayAllowsSport(day(120), "running")).toBe(true);
    expect(dayAllowsSport(day(120, ["running"]), "running")).toBe(true);
    expect(dayAllowsSport(day(120, ["cycling"]), "running")).toBe(false);
    expect(dayAllowsSport(day(0), "running")).toBe(false);
  });

  it("keeps each long session on one day only", () => {
    let week = emptyWeek().map(() => day(120));
    week = setLongSessionDay(week, "running", 6);
    week = setLongSessionDay(week, "cycling", 5);
    week = setLongSessionDay(week, "running", 5); // move the long run to Saturday
    expect(longSessionDay(week, "running")).toBe(5);
    expect(longSessionDay(week, "cycling")).toBe(5);
    expect(week[6].longSessions).toEqual([]);
    expect(longSessionDay(setLongSessionDay(week, "running", null), "running")).toBeNull();
  });

  it("requires a long session day for running and cycling only", () => {
    const week = setLongSessionDay(emptyWeek().map(() => day(120)), "cycling", 5);
    expect(missingLongSessions(week, ["swimming", "cycling", "running"])).toEqual(["running"]);
    expect(missingLongSessions(week, ["swimming", "cycling"])).toEqual([]);
    expect(missingLongSessions(emptyWeek(), ["swimming", "strength"])).toEqual([]);
  });

  it("drops long sessions that no longer fit the day", () => {
    expect(normalizeDay({ minutes: 0, sports: ["running"], longSessions: ["running"] })).toEqual({
      minutes: 0,
      sports: [],
      longSessions: [],
    });
    expect(normalizeDay({ minutes: 90, sports: ["swimming"], longSessions: ["running"] }).longSessions).toEqual([]);
  });
});

describe("slider positions", () => {
  it("uses the far left for a rest day and starts at 30 minutes", () => {
    expect(sliderPositionToMinutes(0)).toBe(0);
    expect(sliderPositionToMinutes(1)).toBe(30);
    expect(sliderPositionToMinutes(2)).toBe(45);
    expect(sliderPositionToMinutes(MAX_SLIDER_POSITION)).toBe(360);
  });

  it("converts back and forth without losing anything", () => {
    for (let position = 0; position <= MAX_SLIDER_POSITION; position++) {
      expect(minutesToSliderPosition(sliderPositionToMinutes(position))).toBe(position);
    }
  });

  it("keeps out-of-range values on the slider", () => {
    expect(minutesToSliderPosition(15)).toBe(1);
    expect(minutesToSliderPosition(999)).toBe(MAX_SLIDER_POSITION);
  });
});

describe("isValidDayMinutes", () => {
  it("allows a rest day and 30 minutes to 6 hours in steps of 15", () => {
    expect(isValidDayMinutes(0)).toBe(true);
    expect(isValidDayMinutes(30)).toBe(true);
    expect(isValidDayMinutes(105)).toBe(true);
    expect(isValidDayMinutes(360)).toBe(true);
    expect(isValidDayMinutes(15)).toBe(false);
    expect(isValidDayMinutes(50)).toBe(false);
    expect(isValidDayMinutes(375)).toBe(false);
  });
});
