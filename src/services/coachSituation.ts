import "server-only";
import { budgetWeekStart } from "@/core/coach/budget";
import type { Situation } from "@/core/coach/conversation";
import { adjustOptions, moveDates, swapDirection, type ProposalChange } from "@/core/coach/proposal";
import { addDays, daysBetween, isoWeekday, startOfWeek, toFormattableDate, todayInTimeZone } from "@/core/dates";
import { isLocale, type Locale } from "@/core/locale";
import type { ExperienceLevel, Sport } from "@/core/training";
import { swimSettingsOf } from "@/core/validation/swim";
import { getWorkout } from "@/core/workouts/library";
import type { getRequestProfile } from "@/lib/currentUser";
import { getAthleteSports } from "./athleteSports";
import { getWeeklyAvailability } from "./availability";
import { getCurrentGoal } from "./goals";
import type { AppSupabaseClient } from "./types";
import { loadSeason } from "./season";
import { getPlannedWorkouts, type PlannedWorkout } from "./workouts";

type Profile = NonNullable<Awaited<ReturnType<typeof getRequestProfile>>>;

export type CoachSetting = {
  situation: Situation;
  locale: Locale;
  today: string;
  budgetSince: string;
  levels: Map<Sport, ExperienceLevel>;
  /** The trainings of the last 7 days and the next two weeks, by id. */
  workouts: Map<string, PlannedWorkout>;
};

/** The name of a training in the user's language. */
export function trainingName(workout: PlannedWorkout, locale: Locale): string {
  return (workout.template_id && getWorkout(workout.template_id)?.name[locale]) || workout.title;
}

/** Everything the coaches may know about the user right now. */
export async function loadCoachSetting(supabase: AppSupabaseClient, profile: Profile): Promise<CoachSetting> {
  const locale: Locale = isLocale(profile.locale) ? profile.locale : "en";
  const today = todayInTimeZone(profile.timezone);
  const [sports, goal, availability, workouts, season] = await Promise.all([
    getAthleteSports(supabase, profile.id),
    getCurrentGoal(supabase, profile.id, today),
    getWeeklyAvailability(supabase, profile.id),
    getPlannedWorkouts(supabase, profile.id, addDays(today, -7), addDays(today, 13)),
    loadSeason(supabase, profile.id, today),
  ]);
  // This week and the next 7, as the coaches see the training blocks.
  const comingWeeks = Array.from({ length: 8 }, (_, index) => season.weekFor(addDays(startOfWeek(today), index * 7)));
  const levels = new Map(sports.map((item) => [item.sport, item.level]));
  const swim = swimSettingsOf(profile);

  const recent = workouts
    .filter((workout) => workout.scheduled_on < today || (workout.scheduled_on === today && workout.status !== "planned"))
    .map((workout) => ({
      date: workout.scheduled_on,
      sport: workout.sport,
      name: trainingName(workout, locale),
      status: workout.status,
      effort: workout.rpe,
      note: workout.feedback_note,
    }));

  const upcoming = workouts
    .filter((workout) => workout.scheduled_on >= today && workout.status === "planned")
    .map((workout) => {
      const template = workout.template_id ? getWorkout(workout.template_id) : undefined;
      const level = levels.get(workout.sport);
      const dayMinutes = availability[isoWeekday(workout.scheduled_on) - 1]?.minutes ?? 0;
      const options =
        template && level && template.sport !== "strength"
          ? adjustOptions(template, level, dayMinutes, swim)
          : { easier: [], similar: [], harder: [] };
      return {
        id: workout.id,
        date: workout.scheduled_on,
        sport: workout.sport,
        name: trainingName(workout, locale),
        minutes: workout.duration_minutes,
        difficulty: template?.difficulty ?? null,
        coachNote: workout.notes,
        options,
      };
    });

  const situation: Situation = {
    language: locale === "nl" ? "Dutch" : "English",
    today,
    athlete: {
      workPattern: profile.work_pattern,
      sports: sports.map((item) => `${item.sport}: ${item.level}`),
    },
    goal: goal && {
      description: goal.description,
      race: goal.race_preset,
      eventDate: goal.event_date,
      weeksToGo: goal.event_date ? Math.max(0, Math.floor(daysBetween(today, goal.event_date) / 7)) : null,
    },
    recent,
    upcoming,
    moveDates: moveDates(today),
    trainingBlocks: comingWeeks.map((week) => ({
      weekStart: week.weekStart,
      phase: week.phase,
      weekType: week.type,
      week: `${week.weekInBlock} of ${week.blockLength}`,
      volumePercent: Math.round(week.volume * 100),
    })),
    recoveryWeekOptions: comingWeeks.filter((week) => week.type === "build").map((week) => week.weekStart),
  };

  return {
    situation,
    locale,
    today,
    budgetSince: budgetWeekStart(today, profile.timezone),
    levels,
    workouts: new Map(workouts.map((workout) => [workout.id, workout])),
  };
}

const labels: Record<Locale, { easier: string; harder: string; similar: string; remove: string; recoveryWeek: string }> = {
  nl: { easier: "lichter", harder: "zwaarder", similar: "anders", remove: "schrappen", recoveryWeek: "Week van {date} wordt een herstelweek" },
  en: { easier: "easier", harder: "harder", similar: "different", remove: "remove", recoveryWeek: "Week of {date} becomes a recovery week" },
};

/** A short line for the app, e.g. "Tue 6 Oct · Tempo 45 → Easy 30 (easier)". */
export function changeLabel(change: ProposalChange, setting: CoachSetting): string {
  const { locale } = setting;
  const day = (date: string) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
      toFormattableDate(date),
    );
  if (change.type === "recovery_week") {
    const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(
      toFormattableDate(change.newDate!),
    );
    return labels[locale].recoveryWeek.replace("{date}", date);
  }
  const workout = setting.workouts.get(change.workoutId);
  if (!workout) return "";
  const name = trainingName(workout, locale);
  if (change.type === "remove") return `${day(workout.scheduled_on)} · ${name} (${labels[locale].remove})`;
  if (change.type === "move") return `${name} · ${day(workout.scheduled_on)} → ${day(change.newDate!)}`;
  const next = getWorkout(change.newWorkoutId!);
  const direction = swapDirection(workout.template_id, change.newWorkoutId!);
  return `${day(workout.scheduled_on)} · ${name} → ${next?.name[locale] ?? change.newWorkoutId} (${labels[locale][direction]})`;
}
