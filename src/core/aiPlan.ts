import { z } from "zod";
import { daysBetween, isoWeekday } from "./dates";
import type { Locale } from "./locale";
import {
  dayCandidates,
  isHardWorkout,
  type PlannedSession,
  type PlannerInput,
  type PlanningContext,
} from "./planner";
import { weekdays, type WorkPattern } from "./training";
import { getWorkout } from "./workouts/library";

// The AI coach plans the week by choosing from the workouts the rules allow on
// each day. This file builds what we send to Claude and turns the answer into
// sessions. The answer is checked with checkPlan before anything is saved.

export const MAX_REASON_LENGTH = 300;

/** What Claude must answer: one workout per day it wants to fill, with a short reason. */
export const aiPlanAnswerSchema = z.object({
  sessions: z.array(
    z.object({
      date: z.string(),
      workoutId: z.string(),
      reason: z.string(),
    }),
  ),
});
export type AiPlanAnswer = z.infer<typeof aiPlanAnswerSchema>;

/** Extra information for the coach that the rules don't need. No name, e-mail or birth date. */
export type CoachContext = {
  locale: Locale;
  workPattern: WorkPattern | null;
  goal: { description: string; racePreset: string | null; eventDate: string | null } | null;
};

export const PLAN_SYSTEM_PROMPT = `You are the training coach in Runvex, an app for amateur endurance athletes (running, cycling, swimming, triathlon) with busy or changing work schedules.

You plan one week by choosing a workout for the open days. Each open day lists the only workouts you may choose, as "id:minutes". The id describes the workout: sport, length (minutes, km or meters), difficulty 1-5 and type, e.g. "run_45_3_tempo" or "swim_1500m_2_endurance". Difficulty 3 and higher is a hard session.

How to plan:
- Train mostly easy: about 80% easy, 20% hard. Never plan more hard sessions than "hardSessionsAllowed", and never two hard days in a row (also counting "alreadyPlanned").
- A day with a long session gets that long session (its options are already limited to it). Make it a calm one.
- Balance the sports over the week; give the sports of the goal a bit more attention.
- Prefer workouts that weren't done last week, and don't repeat a workout within the week.
- Use the available time well, but an easier or shorter session is better than too much for the level. You may leave a day empty when rest is wiser, e.g. right before a race or for a beginner with many days.
- Shift workers and people with changing schedules benefit from a calm session after a heavy day.

Answer with the sessions you plan. For each session give a short reason (one sentence, max 200 characters) in the athlete's language, addressing the athlete as "you" (Dutch: "je").`;

/** The week as compact JSON for the user message. */
export function buildPlanMessage(input: PlannerInput, context: PlanningContext, coach: CoachContext): string {
  const describe = (id: string) => {
    const workout = getWorkout(id);
    return workout ? { id, hard: isHardWorkout(workout) } : { id, hard: false };
  };

  const week = {
    language: coach.locale === "nl" ? "Dutch" : "English",
    today: input.today,
    weekStart: input.weekStart,
    athlete: {
      workPattern: coach.workPattern,
      sports: input.sports.map((item) => `${item.sport}: ${item.level}`),
    },
    goal: coach.goal && {
      description: coach.goal.description,
      race: coach.goal.racePreset,
      eventDate: coach.goal.eventDate,
      weeksToGo:
        coach.goal.eventDate === null
          ? null
          : Math.max(0, Math.floor(daysBetween(input.today, coach.goal.eventDate) / 7)),
      sports: context.goalSports,
    },
    hardSessionsAllowed: context.hardAllowed,
    alreadyPlanned: input.existing.map((workout) => ({
      date: workout.scheduledOn,
      sport: workout.sport,
      ...(workout.templateId ? describe(workout.templateId) : {}),
    })),
    lastWeek: input.recentTemplateIds,
    openDays: context.days.map((day) => ({
      date: day.date,
      weekday: weekdays[isoWeekday(day.date) - 1],
      availableMinutes: day.minutes,
      longSession: day.long,
      mayBeHard: day.canBeHard,
      options: dayCandidates(context, day).map((item) => `${item.workout.id}:${item.minutes}`),
    })),
  };
  return `Plan this week:\n${JSON.stringify(week)}`;
}

/**
 * Turns Claude's answer into sessions with a reason. The duration comes from our own
 * candidate list, not from Claude. Unknown dates or workouts are kept as they are,
 * so checkPlan can reject them.
 */
export function sessionsFromAnswer(
  context: PlanningContext,
  answer: AiPlanAnswer,
): (PlannedSession & { reason: string })[] {
  return answer.sessions.map((item) => {
    const day = context.days.find((open) => open.date === item.date);
    const candidate = day ? dayCandidates(context, day).find((c) => c.workout.id === item.workoutId) : undefined;
    const workout = candidate?.workout ?? getWorkout(item.workoutId);
    return {
      scheduledOn: item.date,
      // An unknown workout gets a placeholder sport; checkPlan rejects it anyway.
      sport: workout && workout.sport !== "strength" ? workout.sport : "running",
      templateId: item.workoutId,
      durationMinutes: candidate?.minutes ?? 0,
      reason: item.reason.trim().slice(0, MAX_REASON_LENGTH),
    };
  });
}
