"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { lastWeekFeedback } from "@/core/aiPlan";
import { budgetWeekStart } from "@/core/coach/budget";
import { addDays, startOfWeek, todayInTimeZone } from "@/core/dates";
import { isLocale } from "@/core/locale";
import { planningContext, planWeek, type PlannerInput } from "@/core/planner";
import type { Sport } from "@/core/training";
import {
  addWorkoutSchema,
  deleteWorkoutSchema,
  moveWorkoutSchema,
  swapWorkoutSchema,
  type AddWorkoutInput,
} from "@/core/validation/workouts";
import { canCheckOff, workoutFeedbackSchema, type WorkoutFeedbackInput } from "@/core/validation/feedback";
import { swimSettingsOf } from "@/core/validation/swim";
import { isValidIsoDate } from "@/core/week";
import { estimatedMinutes } from "@/core/workouts/estimate";
import { getWorkout } from "@/core/workouts/library";
import { poolLengths } from "@/core/workouts/swim";
import { swimWorkoutInPool } from "@/core/workouts/swimTraining";
import { createClient } from "@/lib/supabase/server";
import { addCoachMessages } from "@/services/coachMessages";
import { loadSeason, setRecoveryWeek } from "@/services/season";
import { isAiCoachConfigured } from "@/services/coachRuntime";
import { planWeekAsTeam, type TeamPlan } from "@/services/teamPlanner";
import { getAthleteSports } from "@/services/athleteSports";
import { getWeeklyAvailability } from "@/services/availability";
import { removeFromWatch, sendToWatch } from "@/services/watchSync";
import { getCurrentGoal } from "@/services/goals";
import { getCurrentProfile } from "@/services/profile";
import { refreshAppData } from "@/lib/refreshAppData";
import {
  addPlannedWorkout,
  changePlannedTemplate,
  deletePlannedWorkout,
  getPlannedWorkout,
  getPlannedWorkouts,
  insertPlannedSessions,
  movePlannedWorkout,
  setWorkoutFeedback,
  swapPlannedWorkout,
} from "@/services/workouts";

/** The profile's language, or English when it's unknown. */
function localeOf(value: string) {
  return isLocale(value) ? value : "en";
}

export type PlanWeekResult =
  | { ok: true; planned: number; source: "ai" | "rules" }
  | { ok: false; error: "invalidWeek" | "pastWeek" | "saveFailed" };

/** Fills the open training days of one week. Days that already have a workout stay as they are. */
export async function planWeekAction(weekStart: string): Promise<PlanWeekResult> {
  // Anyone can call a Server Action with any value, so check the date first.
  if (!isValidIsoDate(weekStart) || startOfWeek(weekStart) !== weekStart) {
    return { ok: false, error: "invalidWeek" };
  }

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "saveFailed" };

  const today = todayInTimeZone(profile.timezone);
  if (addDays(weekStart, 6) < today) return { ok: false, error: "pastWeek" };

  const [availability, sports, goal, existing, lastWeek, season] = await Promise.all([
    getWeeklyAvailability(supabase, profile.id),
    getAthleteSports(supabase, profile.id),
    getCurrentGoal(supabase, profile.id, today),
    getPlannedWorkouts(supabase, profile.id, weekStart, addDays(weekStart, 6)),
    getPlannedWorkouts(supabase, profile.id, addDays(weekStart, -7), addDays(weekStart, -1)),
    loadSeason(supabase, profile.id, today),
  ]);

  const input: PlannerInput = {
    weekStart,
    today,
    availability,
    sports,
    existing: existing.map((workout) => ({
      scheduledOn: workout.scheduled_on,
      sport: workout.sport,
      templateId: workout.template_id,
    })),
    recentTemplateIds: lastWeek.flatMap((workout) => (workout.template_id ? [workout.template_id] : [])),
    goal: goal && { sports: goal.sports, eventDate: goal.event_date },
    swim: swimSettingsOf(profile),
    season: season.weekFor(weekStart),
    maxWeeklyMinutes: season.maxWeeklyMinutes,
  };
  const context = planningContext(input);
  if (context.days.length === 0) return { ok: true, planned: 0, source: "rules" };

  const locale = isLocale(profile.locale) ? profile.locale : "en";
  let sessions: (ReturnType<typeof planWeek>[number] & { reason?: string })[] | null = null;
  let source: "ai" | "rules" = "rules";

  // 1. The coach team plans: the head coach makes the outline, the run, bike and
  //    swim coaches choose the workouts. When the AI isn't set up, fails or this
  //    week's budget is used up, the rules plan the week (step 3).
  let team: TeamPlan | null = null;
  if (isAiCoachConfigured()) {
    team = await planWeekAsTeam({
      supabase,
      userId: profile.id,
      budgetSince: budgetWeekStart(today, profile.timezone),
      input,
      context,
      coach: {
        locale,
        lastWeekFeedback: lastWeekFeedback(lastWeek),
        workPattern: profile.work_pattern,
        goal: goal && {
          description: goal.description,
          racePreset: goal.race_preset,
          eventDate: goal.event_date,
        },
      },
    });
    // 2. The team's plan is already checked against the same rules as the rule-based planner.
    if (team) {
      sessions = team.sessions;
      source = "ai";
    }
  }

  // 3. Fallback: the rule-based planner always gives a valid week.
  sessions ??= planWeek(input);

  const { data: inserted, error } = await insertPlannedSessions(
    supabase,
    profile.id,
    sessions.map((session) => ({
      ...session,
      // Stored as a fallback; the app shows the name in the current language.
      title: getWorkout(session.templateId)?.name[locale] ?? session.templateId,
      notes: session.reason || null,
    })),
  );
  if (error) {
    console.error("Saving the week plan failed:", error.message);
    return { ok: false, error: "saveFailed" };
  }
  if (team && team.messages.length > 0) {
    try {
      await addCoachMessages(
        supabase,
        profile.id,
        team.messages.map((message) => ({ role: "coach", agent: message.agent, content: message.content })),
      );
    } catch (messagesError) {
      // The plan itself is saved; only the explanation is missing.
      console.error("Saving the coaches' messages failed:", messagesError);
    }
  }
  // After the response, so the user doesn't wait for the watch.
  after(() => sendToWatch(inserted, locale));

  refreshAppData();
  return { ok: true, planned: sessions.length, source };
}

// ---------------------------------------------------------------------------
// Changing single trainings: swap, move, delete, add.
// ---------------------------------------------------------------------------

export type WorkoutActionResult = { ok: boolean };

/** The level for this sport, used to estimate swim durations. */
async function levelFor(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, sport: Sport) {
  const sports = await getAthleteSports(supabase, userId);
  return sports.find((item) => item.sport === sport)?.level ?? "intermediate";
}

/** Replaces a training by another library workout of the same sport. */
export async function swapWorkoutAction(id: string, templateId: string): Promise<WorkoutActionResult> {
  const parsed = swapWorkoutSchema.safeParse({ id, templateId });
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };

  const workout = await getPlannedWorkout(supabase, profile.id, parsed.data.id);
  const template = getWorkout(parsed.data.templateId);
  // A training you did stays as it was, so your history stays right.
  if (!workout || workout.status === "done" || !template || template.sport !== workout.sport) return { ok: false };

  const minutes = estimatedMinutes(template, await levelFor(supabase, profile.id, template.sport));
  if (minutes === null) return { ok: false };

  const locale = isLocale(profile.locale) ? profile.locale : "en";
  const { error } = await swapPlannedWorkout(supabase, profile.id, workout.id, {
    templateId: template.id,
    title: template.name[locale],
    durationMinutes: minutes,
  });
  if (error) {
    console.error("Swapping a workout failed:", error.message);
    return { ok: false };
  }
  after(async () => {
    const updated = await getPlannedWorkout(supabase, profile.id, workout.id);
    if (updated) await sendToWatch([updated], locale);
  });
  refreshAppData();
  return { ok: true };
}

/** Moves a training to another day (the "Move to" menu and dragging). */
export async function moveWorkoutAction(id: string, date: string): Promise<WorkoutActionResult> {
  const parsed = moveWorkoutSchema.safeParse({ id, date });
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };

  const current = await getPlannedWorkout(supabase, profile.id, parsed.data.id);
  if (!current || current.status === "done") return { ok: false };

  const { error } = await movePlannedWorkout(supabase, profile.id, parsed.data.id, parsed.data.date);
  if (error) {
    console.error("Moving a workout failed:", error.message);
    return { ok: false };
  }
  after(async () => {
    const moved = await getPlannedWorkout(supabase, profile.id, parsed.data.id);
    if (moved) await sendToWatch([moved], localeOf(profile.locale));
  });
  refreshAppData();
  return { ok: true };
}

export async function deleteWorkoutAction(id: string): Promise<WorkoutActionResult> {
  const parsed = deleteWorkoutSchema.safeParse({ id });
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };

  const { error } = await deletePlannedWorkout(supabase, profile.id, parsed.data.id);
  if (error) {
    console.error("Deleting a workout failed:", error.message);
    return { ok: false };
  }
  after(() => removeFromWatch([parsed.data.id]));
  refreshAppData();
  return { ok: true };
}

/** Adds a training: a library workout or your own (e.g. strength). Then shows its week. */
export async function addWorkoutAction(input: AddWorkoutInput): Promise<WorkoutActionResult> {
  const parsed = addWorkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const data = parsed.data;

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };

  let title = data.title;
  let durationMinutes = data.durationMinutes;
  if (data.templateId !== null) {
    // A library workout: its name and duration come from the library, not from the form.
    const template = getWorkout(data.templateId);
    if (!template || template.sport !== data.sport) return { ok: false };
    durationMinutes = estimatedMinutes(template, await levelFor(supabase, profile.id, data.sport));
    title = template.name[isLocale(profile.locale) ? profile.locale : "en"];
  }
  if (durationMinutes === null) return { ok: false };

  const { data: added, error } = await addPlannedWorkout(supabase, profile.id, {
    date: data.date,
    sport: data.sport,
    templateId: data.templateId,
    title,
    durationMinutes,
  });
  if (error) {
    console.error("Adding a workout failed:", error.message);
    return { ok: false };
  }
  after(() => sendToWatch([added], localeOf(profile.locale)));
  refreshAppData();
  // redirect() works by throwing, so it must stay outside try/catch.
  redirect(`/week?week=${startOfWeek(data.date)}`);
}

/** Sends all trainings of one week to the watch, e.g. ones planned before the watch was linked. */
export async function sendWeekToWatchAction(weekStart: string): Promise<WorkoutActionResult> {
  if (!isValidIsoDate(weekStart) || startOfWeek(weekStart) !== weekStart) return { ok: false };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };

  const workouts = await getPlannedWorkouts(supabase, profile.id, weekStart, addDays(weekStart, 6));
  // Here we wait for the answer, so the button can say whether it worked.
  return { ok: await sendToWatch(workouts, localeOf(profile.locale)) };
}

/** The same swim training in a 25 m or 50 m pool: drills then cover whole lengths of that pool. */
export async function changeSwimPoolAction(id: string, poolLength: number): Promise<WorkoutActionResult> {
  const parsed = deleteWorkoutSchema.safeParse({ id });
  const pool = poolLengths.find((length) => length === poolLength);
  if (!parsed.success || pool === undefined) return { ok: false };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };

  const workout = await getPlannedWorkout(supabase, profile.id, parsed.data.id);
  const templateId = workout?.template_id ? swimWorkoutInPool(workout.template_id, pool) : null;
  const template = templateId ? getWorkout(templateId) : undefined;
  if (!workout || workout.status === "done" || !template) return { ok: false };

  const minutes = estimatedMinutes(template, await levelFor(supabase, profile.id, "swimming"));
  if (minutes === null) return { ok: false };

  const { error } = await changePlannedTemplate(supabase, profile.id, workout.id, {
    templateId: template.id,
    title: template.name[localeOf(profile.locale)],
    durationMinutes: minutes,
  });
  if (error) {
    console.error("Changing the pool failed:", error.message);
    return { ok: false };
  }
  // Swims don't go to the watch, so nothing to sync.
  refreshAppData();
  return { ok: true };
}

/** Checks a training off: done (with how hard it felt), skipped, or back to planned. */
export async function saveWorkoutFeedbackAction(input: WorkoutFeedbackInput): Promise<WorkoutActionResult> {
  const parsed = workoutFeedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };

  const workout = await getPlannedWorkout(supabase, profile.id, parsed.data.id);
  if (!workout) return { ok: false };
  // Not in advance: you can only say you did (or skipped) a training from its day on.
  const today = todayInTimeZone(profile.timezone);
  if (parsed.data.status !== "planned" && !canCheckOff(workout.scheduled_on, today)) return { ok: false };

  const { error } = await setWorkoutFeedback(supabase, profile.id, workout.id, parsed.data);
  if (error) {
    console.error("Saving workout feedback failed:", error.message);
    return { ok: false };
  }
  refreshAppData();
  return { ok: true };
}

/** Turns a week into a recovery week (or back): the training blocks shift around it. */
export async function setRecoveryWeekAction(weekStart: string, on: boolean): Promise<WorkoutActionResult> {
  if (!isValidIsoDate(weekStart) || startOfWeek(weekStart) !== weekStart) return { ok: false };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };
  // Only this week and later: the past stays as it was.
  if (weekStart < startOfWeek(todayInTimeZone(profile.timezone))) return { ok: false };

  const { error } = await setRecoveryWeek(supabase, profile.id, weekStart, on);
  if (error) {
    console.error("Changing the recovery week failed:", error.message);
    return { ok: false };
  }
  refreshAppData();
  return { ok: true };
}
