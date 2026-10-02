"use server";

import { refresh } from "next/cache";
import { buildPlanMessage, sessionsFromAnswer } from "@/core/aiPlan";
import { addDays, startOfWeek, todayInTimeZone } from "@/core/dates";
import { isLocale } from "@/core/locale";
import { checkPlan, planningContext, planWeek, type PlannerInput } from "@/core/planner";
import { isValidIsoDate } from "@/core/week";
import { getWorkout } from "@/core/workouts/library";
import { createClient } from "@/lib/supabase/server";
import { requestAiPlan, isAiCoachConfigured } from "@/services/aiCoach";
import { countAiRequestsSince, logAiRequest } from "@/services/aiRequests";
import { getAthleteSports } from "@/services/athleteSports";
import { getWeeklyAvailability } from "@/services/availability";
import { getCurrentGoal } from "@/services/goals";
import { getCurrentProfile } from "@/services/profile";
import { getPlannedWorkouts, insertPlannedSessions } from "@/services/workouts";

/** At most this many AI week plans per user per 24 hours; after that the rules plan. */
const AI_PLANS_PER_DAY = 10;

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

  const [availability, sports, goal, existing, lastWeek] = await Promise.all([
    getWeeklyAvailability(supabase, profile.id),
    getAthleteSports(supabase, profile.id),
    getCurrentGoal(supabase, profile.id, today),
    getPlannedWorkouts(supabase, profile.id, weekStart, addDays(weekStart, 6)),
    getPlannedWorkouts(supabase, profile.id, addDays(weekStart, -7), addDays(weekStart, -1)),
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
  };
  const context = planningContext(input);
  if (context.days.length === 0) return { ok: true, planned: 0, source: "rules" };

  const locale = isLocale(profile.locale) ? profile.locale : "en";
  let sessions: (ReturnType<typeof planWeek>[number] & { reason?: string })[] | null = null;
  let source: "ai" | "rules" = "rules";

  // 1. Ask the AI coach, unless it isn't set up or the daily limit is reached.
  if (isAiCoachConfigured()) {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const used = await countAiRequestsSince(supabase, profile.id, "plan_week", since);
      if (used < AI_PLANS_PER_DAY) {
        // Logged before the call, so failed or slow requests count too.
        await logAiRequest(supabase, profile.id, "plan_week");
        const message = buildPlanMessage(input, context, {
          locale,
          workPattern: profile.work_pattern,
          goal: goal && {
            description: goal.description,
            racePreset: goal.race_preset,
            eventDate: goal.event_date,
          },
        });
        const answer = await requestAiPlan(message);
        if (answer) {
          const aiSessions = sessionsFromAnswer(context, answer);
          // 2. The coach's plan must follow the same rules as the rule-based planner.
          const problems = checkPlan(context, aiSessions);
          if (problems.length === 0) {
            sessions = aiSessions;
            source = "ai";
          } else {
            console.warn("AI week plan rejected:", problems);
          }
        }
      }
    } catch (error) {
      // E.g. the usage log can't be read: no AI this time, the rules still plan the week.
      console.error("AI week plan skipped:", error);
    }
  }

  // 3. Fallback: the rule-based planner always gives a valid week.
  sessions ??= planWeek(input);

  const { error } = await insertPlannedSessions(
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

  refresh();
  return { ok: true, planned: sessions.length, source };
}
