import { emptyWeek, longSessionSports, type DayAvailability, type LongSessionSport } from "@/core/availability";
import type { AppSupabaseClient } from "./types";

const isLongSessionSport = (sport: string): sport is LongSessionSport =>
  (longSessionSports as readonly string[]).includes(sport);

/** The user's usual week, index 0 = Monday. Missing days count as rest days. */
export async function getWeeklyAvailability(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<DayAvailability[]> {
  const { data, error } = await supabase
    .from("weekly_availability")
    .select("weekday, available_minutes, sports, long_sessions")
    .eq("user_id", userId);
  if (error) throw error;

  const week = emptyWeek();
  for (const row of data) {
    week[row.weekday - 1] = {
      minutes: row.available_minutes,
      sports: row.sports,
      longSessions: row.long_sessions.filter(isLongSessionSport),
    };
  }
  return week;
}

/** The week in the JSON shape the database expects (snake_case names). */
export function toAvailabilityRows(days: ({ weekday: number } & DayAvailability)[]) {
  return days.map((day) => ({
    weekday: day.weekday,
    minutes: day.minutes,
    sports: day.sports,
    long_sessions: day.longSessions,
  }));
}

/** Saves all 7 days at once. "Upsert" = update the row if it exists, insert it if not. */
export async function saveWeeklyAvailability(
  supabase: AppSupabaseClient,
  userId: string,
  days: ({ weekday: number } & DayAvailability)[],
) {
  return supabase.from("weekly_availability").upsert(
    days.map((day) => ({
      user_id: userId,
      weekday: day.weekday,
      available_minutes: day.minutes,
      sports: day.sports,
      long_sessions: day.longSessions,
    })),
    { onConflict: "user_id,weekday" },
  );
}
