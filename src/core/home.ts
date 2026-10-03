import type { Sport } from "./training";

// Numbers for the Home dashboard. Pure logic, so it's easy to test.

export type PartOfDay = "morning" | "afternoon" | "evening";

/** The hour (0-23) right now in the user's time zone. */
export function hourInTimeZone(timeZone: string, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(now);
  return Number(hour);
}

/** "Good morning" until 12, "Good afternoon" until 18, then "Good evening". */
export function partOfDay(hour: number): PartOfDay {
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

type CheckedWorkout = { scheduled_on: string; status: string };

/**
 * How many trainings in a row you did, counting back from today. Today's training
 * only counts once it's done; a skipped or forgotten training ends the streak.
 */
export function doneStreak(workouts: CheckedWorkout[], today: string): number {
  const counted = workouts
    .filter((workout) => workout.scheduled_on < today || (workout.scheduled_on === today && workout.status === "done"))
    .sort((a, b) => b.scheduled_on.localeCompare(a.scheduled_on));
  let streak = 0;
  for (const workout of counted) {
    if (workout.status !== "done") break;
    streak++;
  }
  return streak;
}

export type SportProgress = { sport: Sport; plannedMinutes: number; doneMinutes: number };

/** Per sport, in a fixed order: the minutes planned this week and the minutes done. */
export function weekSportProgress(
  workouts: { sport: Sport; duration_minutes: number; status: string }[],
): SportProgress[] {
  const order: Sport[] = ["swimming", "cycling", "running", "strength"];
  return order.flatMap((sport) => {
    const ofSport = workouts.filter((workout) => workout.sport === sport);
    if (ofSport.length === 0) return [];
    const minutes = (list: typeof ofSport) => list.reduce((total, workout) => total + workout.duration_minutes, 0);
    return [{ sport, plannedMinutes: minutes(ofSport), doneMinutes: minutes(ofSport.filter((w) => w.status === "done")) }];
  });
}

/** The moment a date starts (00:00) in a time zone, as a timestamp. */
export function startOfDayInTimeZone(date: string, timeZone: string): number {
  const utcMidnight = Date.parse(`${date}T00:00:00Z`);
  // How far the time zone is ahead of UTC on that day, e.g. +2 hours in Dutch summer.
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(utcMidnight)
      .map((part) => [part.type, part.value]),
  );
  const asLocal = Date.parse(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);
  return utcMidnight - (asLocal - utcMidnight);
}

/** Days, hours and minutes left until a moment; all 0 once it has passed. */
export function countdownParts(target: number, now: number): { days: number; hours: number; minutes: number } {
  const totalMinutes = Math.max(0, Math.floor((target - now) / 60_000));
  return {
    days: Math.floor(totalMinutes / (24 * 60)),
    hours: Math.floor((totalMinutes % (24 * 60)) / 60),
    minutes: totalMinutes % 60,
  };
}
