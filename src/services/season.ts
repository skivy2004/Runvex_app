import { maxWeeklyMinutes, seasonPlan, seasonWeekFor, type SeasonWeek } from "@/core/periodization";
import type { Sport } from "@/core/training";
import { getAthleteSports } from "./athleteSports";
import { getCurrentGoal } from "./goals";
import type { AppSupabaseClient } from "./types";

export type Season = {
  /** All weeks up to race day, or null without a goal with a date ahead. */
  plan: SeasonWeek[] | null;
  beginner: boolean;
  recoveryWeeks: string[];
  /** The most minutes in your heaviest week, by goal and level. */
  maxWeeklyMinutes: number;
  /** The block week for any Monday. */
  weekFor: (weekStart: string) => SeasonWeek;
};

/** Weeks (Mondays) the user turned into a recovery week. */
export async function getRecoveryWeeks(supabase: AppSupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("recovery_weeks").select("week_start").eq("user_id", userId);
  if (error) throw error;
  return data.map((row) => row.week_start);
}

export async function setRecoveryWeek(supabase: AppSupabaseClient, userId: string, weekStart: string, on: boolean) {
  return on
    ? supabase.from("recovery_weeks").upsert({ user_id: userId, week_start: weekStart })
    : supabase.from("recovery_weeks").delete().eq("user_id", userId).eq("week_start", weekStart);
}

/**
 * The user's training blocks: from the current goal with a date ahead, otherwise
 * the steady rhythm. Beginners (in a sport of the goal, or any sport without one)
 * train in blocks of 2 + 1.
 */
export async function loadSeason(supabase: AppSupabaseClient, userId: string, today: string): Promise<Season> {
  const [goal, sports, recoveryWeeks] = await Promise.all([
    getCurrentGoal(supabase, userId, today),
    getAthleteSports(supabase, userId),
    getRecoveryWeeks(supabase, userId),
  ]);
  const goalSports: Sport[] = goal && goal.sports.length > 0 ? goal.sports : sports.map((item) => item.sport);
  const goalLevels = sports.filter((item) => goalSports.includes(item.sport)).map((item) => item.level);
  const beginner = goalLevels.includes("beginner");
  const plan =
    goal?.event_date && goal.event_date >= today
      ? seasonPlan({
          goalCreatedOn: goal.created_at.slice(0, 10),
          eventDate: goal.event_date,
          racePreset: goal.race_preset,
          beginner,
          recoveryOverrides: recoveryWeeks,
        })
      : null;
  return {
    plan,
    beginner,
    recoveryWeeks,
    maxWeeklyMinutes: maxWeeklyMinutes(goalLevels, goal?.race_preset ?? null),
    weekFor: (weekStart) => seasonWeekFor(weekStart, plan, beginner, recoveryWeeks),
  };
}
