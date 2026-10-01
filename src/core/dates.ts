// Calendar dates as "YYYY-MM-DD" strings, like the database stores them.
// All math is done in UTC so daylight saving time can never shift a day.

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcMs(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function fromUtcMs(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Today's date in the user's time zone (not the server's), e.g. "Europe/Amsterdam". */
export function todayInTimeZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(isoDate: string, days: number): string {
  return fromUtcMs(toUtcMs(isoDate) + days * DAY_MS);
}

/** Number of days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export function isoWeekday(isoDate: string): number {
  const day = new Date(toUtcMs(isoDate)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** The Monday of the week that contains this date. */
export function startOfWeek(isoDate: string): string {
  return addDays(isoDate, 1 - isoWeekday(isoDate));
}

/** A Date for formatting a calendar date; format it with timeZone "UTC". */
export function toFormattableDate(isoDate: string): Date {
  return new Date(toUtcMs(isoDate));
}
