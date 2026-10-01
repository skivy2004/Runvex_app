import { addDays, daysBetween, startOfWeek } from "./dates";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Whether the text is a real calendar date like "2026-10-01" (not "2026-02-31"). */
export function isValidIsoDate(value: string): boolean {
  // addDays(value, 0) rewrites impossible dates (e.g. Feb 31 becomes Mar 3).
  return ISO_DATE.test(value) && addDays(value, 0) === value;
}

/**
 * The Monday of the week to show. Comes from the URL (?week=2026-09-28), which
 * anyone can edit, so anything that isn't a valid date falls back to this week.
 */
export function resolveWeekStart(weekParam: string | undefined, today: string): string {
  return weekParam && isValidIsoDate(weekParam) ? startOfWeek(weekParam) : startOfWeek(today);
}

/** Splits workouts into 7 lists, index 0 = Monday. Workouts outside the week are ignored. */
export function groupByWeekday<T extends { scheduled_on: string }>(weekStart: string, items: T[]): T[][] {
  const days: T[][] = [[], [], [], [], [], [], []];
  for (const item of items) {
    const index = daysBetween(weekStart, item.scheduled_on);
    if (index >= 0 && index < 7) days[index].push(item);
  }
  return days;
}
