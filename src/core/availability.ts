import type { Sport } from "./training";

// Time per training day: 30 minutes to 6 hours, in steps of 15 minutes. 0 = rest day.
export const MIN_DAY_MINUTES = 30;
export const MAX_DAY_MINUTES = 360;
export const MINUTES_STEP = 15;

/** Sports that can have a weekly long session: the long run and the long ride. */
export const longSessionSports = ["running", "cycling"] as const;
export type LongSessionSport = (typeof longSessionSports)[number];

/** One day of the user's usual week. */
export type DayAvailability = {
  minutes: number;
  /** Sports the user wants to do that day. Empty = flexible. */
  sports: Sport[];
  /** Long sessions planned on this day, e.g. ["running"] for the long run. */
  longSessions: LongSessionSport[];
};

export function emptyDay(): DayAvailability {
  return { minutes: 0, sports: [], longSessions: [] };
}

export function emptyWeek(): DayAvailability[] {
  return Array.from({ length: 7 }, emptyDay);
}

export function isValidDayMinutes(minutes: number): boolean {
  return (
    minutes === 0 ||
    (minutes >= MIN_DAY_MINUTES && minutes <= MAX_DAY_MINUTES && minutes % MINUTES_STEP === 0)
  );
}

/** Whether this sport fits the day: the day is on, and the sport is chosen or the day is flexible. */
export function dayAllowsSport(day: DayAvailability, sport: Sport): boolean {
  return day.minutes > 0 && (day.sports.length === 0 || day.sports.includes(sport));
}

/**
 * Removes what no longer fits after a change: a rest day has no sports and no
 * long sessions, and a long session needs its sport to be allowed that day.
 */
export function normalizeDay(day: DayAvailability): DayAvailability {
  if (day.minutes === 0) return emptyDay();
  return { ...day, longSessions: day.longSessions.filter((sport) => dayAllowsSport(day, sport)) };
}

/** Puts the long session for this sport on one day (or none), removing it from all other days. */
export function setLongSessionDay(
  week: DayAvailability[],
  sport: LongSessionSport,
  dayIndex: number | null,
): DayAvailability[] {
  return week.map((day, index) => {
    const others = day.longSessions.filter((item) => item !== sport);
    return { ...day, longSessions: index === dayIndex ? [...others, sport] : others };
  });
}

/**
 * Long sessions that still need a day: everyone who runs needs a long run day,
 * everyone who cycles needs a long ride day.
 */
export function missingLongSessions(week: DayAvailability[], userSports: Sport[]): LongSessionSport[] {
  return longSessionSports.filter(
    (sport) => userSports.includes(sport) && longSessionDay(week, sport) === null,
  );
}

/** The day that holds the long session for this sport, or null. */
export function longSessionDay(week: DayAvailability[], sport: LongSessionSport): number | null {
  const index = week.findIndex((day) => day.longSessions.includes(sport));
  return index === -1 ? null : index;
}

/*
 * The slider works in positions instead of minutes, so its far left can mean
 * "rest day" while the first real step is 30 minutes:
 *   position 0 = rest day, 1 = 30 min, 2 = 45 min, ... 23 = 6 h
 */
export const MAX_SLIDER_POSITION = (MAX_DAY_MINUTES - MIN_DAY_MINUTES) / MINUTES_STEP + 1;

export function minutesToSliderPosition(minutes: number): number {
  if (minutes <= 0) return 0;
  const position = Math.round((minutes - MIN_DAY_MINUTES) / MINUTES_STEP) + 1;
  return Math.min(Math.max(position, 1), MAX_SLIDER_POSITION);
}

export function sliderPositionToMinutes(position: number): number {
  return position <= 0 ? 0 : MIN_DAY_MINUTES + (position - 1) * MINUTES_STEP;
}
