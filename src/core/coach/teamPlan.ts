import { z } from "zod";
import { MAX_REASON_LENGTH, swimOptions, weekBackground, type CoachContext } from "@/core/aiPlan";
import { addDays, isoWeekday } from "@/core/dates";
import {
  dayCandidates,
  pickWorkout,
  plannableSports,
  type Kind,
  type OpenDay,
  type PlannableSport,
  type PlannedSession,
  type PlannerInput,
  type PlanningContext,
} from "@/core/planner";
import { weekdays } from "@/core/training";
import { getWorkout } from "@/core/workouts/library";

// Planning a week as a team, in two rounds:
//   1. The head coach makes the outline: per open day the sport and whether it's
//      an easy, hard or long session (or rest).
//   2. The run, bike and swim coaches each choose the workouts for their own days,
//      from the options the rules allow.
// Everything a coach answers is checked here; a choice that breaks a rule is
// replaced by the rule-based planner's choice for that day, so one mistake never
// costs the whole plan. Pure logic: the API calls are in services/teamPlanner.ts.

const MAX_NOTE_LENGTH = 300;

// ---------------------------------------------------------------------------
// Round 1: the head coach's outline
// ---------------------------------------------------------------------------

export const outlineSchema = z.object({
  /** One or two sentences to the athlete about this week's idea. */
  summary: z.string(),
  days: z.array(
    z.object({
      date: z.string(),
      sport: z.enum(["running", "cycling", "swimming", "rest"]),
      kind: z.enum(["easy", "hard", "long"]),
      /** For the specialist: what this day is for. */
      note: z.string(),
    }),
  ),
});
export type Outline = z.infer<typeof outlineSchema>;

/** One open day as the head coach assigned it. */
export type Assignment = { day: OpenDay; sport: PlannableSport; kind: Kind; note: string };

/** Per sport, which kinds of session fit this day (e.g. running: easy, hard). */
function kindsPerSport(context: PlanningContext, day: OpenDay): Partial<Record<PlannableSport, Kind[]>> {
  const result: Partial<Record<PlannableSport, Kind[]>> = {};
  for (const candidate of dayCandidates(context, day)) {
    const sport = candidate.workout.sport as PlannableSport;
    const kinds = (result[sport] ??= []);
    if (!kinds.includes(candidate.kind)) kinds.push(candidate.kind);
  }
  return result;
}

export const OUTLINE_INSTRUCTIONS = `Make the outline of this week, as the head coach. For each open day choose the sport and the kind of session: "easy", "hard" or "long", or "rest" to leave the day empty. "options" lists, per sport, the kinds that fit that day; only choose from those. The run, bike and swim coaches will then choose the actual workouts for their days, so add a short note per day for them (what the day is for, e.g. "easy spin after yesterday's long run", "threshold, the key session of the week").

Rules for the outline:
- At most "hardSessionsAllowed" hard days, never two hard days in a row (also counting "alreadyPlanned").
- A long-session day ("longSession") gets that long session.
- Balance the sports over the week, a bit more attention for the sports of the goal.
- Rest is fine when it's wiser, e.g. after a heavy week, before a race, or when "lastWeekFeedback" shows many skipped sessions or a high average effort (8 or more).

"trainingBlock" tells where this week sits in the training blocks: the phase (base, build, peak, taper, race, maintain), whether it's a build, recovery, taper or race week, which week of the block, and the share of the available time to use (the available minutes are already scaled to it, and "hardSessionsAllowed" follows it). Plan in that spirit: a recovery week is light and easy, base is mostly easy endurance, build adds threshold work, the peak is race-specific, the taper keeps a few short sharp efforts but much less volume.

Also write a "summary": one or two sentences to the athlete about the idea of this week, mentioning where it sits in the block (e.g. "week 3 of 3, the hardest of this block; next week you recover").`;

export function buildOutlineMessage(input: PlannerInput, context: PlanningContext, coach: CoachContext): string {
  const week = {
    ...weekBackground(input, context, coach),
    openDays: context.days.map((day) => ({
      date: day.date,
      weekday: weekdays[isoWeekday(day.date) - 1],
      availableMinutes: day.minutes,
      longSession: day.long,
      mayBeHard: day.canBeHard,
      options: kindsPerSport(context, day),
    })),
  };
  return `${OUTLINE_INSTRUCTIONS}\n\nThe week:\n${JSON.stringify(week)}`;
}

/**
 * The head coach's outline, checked against the rules: only open days, sports and
 * kinds that fit, at most the allowed hard days and never two in a row. A hard day
 * that breaks a rule becomes easy; anything else that doesn't fit is dropped.
 */
export function checkOutline(context: PlanningContext, outline: Outline): Assignment[] {
  const assignments: Assignment[] = [];
  const hardDates = new Set(context.existingHardDates);
  const seen = new Set<string>();

  for (const item of [...outline.days].sort((a, b) => a.date.localeCompare(b.date))) {
    if (item.sport === "rest" || seen.has(item.date)) continue;
    const day = context.days.find((open) => open.date === item.date);
    if (!day) continue;
    const kinds = kindsPerSport(context, day)[item.sport] ?? [];
    let kind: Kind = item.kind;

    // A long-session day keeps its long session; elsewhere "long" means a normal easy session.
    if (day.long === item.sport && kinds.includes("long")) kind = "long";
    else if (kind === "long") kind = "easy";

    if (kind === "hard") {
      const tooMany = [...hardDates].filter((date) => !context.existingHardDates.has(date)).length >= context.hardAllowed;
      const nextToHard = hardDates.has(addDays(day.date, -1)) || hardDates.has(addDays(day.date, 1));
      if (tooMany || nextToHard || !kinds.includes("hard")) kind = "easy";
    }
    if (!kinds.includes(kind)) continue;

    if (kind === "hard") hardDates.add(day.date);
    seen.add(day.date);
    assignments.push({ day, sport: item.sport, kind, note: item.note.trim().slice(0, MAX_NOTE_LENGTH) });
  }
  return assignments;
}

// ---------------------------------------------------------------------------
// Round 2: the specialists choose the workouts
// ---------------------------------------------------------------------------

export const specialistAnswerSchema = z.object({
  /** One or two sentences to the athlete about this sport this week. */
  summary: z.string(),
  sessions: z.array(z.object({ date: z.string(), workoutId: z.string(), reason: z.string() })),
});
export type SpecialistAnswer = z.infer<typeof specialistAnswerSchema>;

const SPECIALIST_INSTRUCTIONS = `The head coach made this week's outline and gave you the days for your sport. For each of your days choose one workout from that day's "options" ("id:minutes"); the id describes the workout, e.g. "run_45_3_tempo" (length, difficulty 1-5, type). Easy days need an easy workout, hard days a hard one (difficulty 3 or more), long days a long, calm one. Follow the head coach's note for the day, prefer workouts that weren't done last week ("lastWeek") and don't repeat a workout within the week.

Give each session a short reason (one sentence, max 200 characters) in the athlete's language, addressing the athlete as "you". Also write a "summary": one or two sentences to the athlete about your sport this week.`;

const SWIM_INSTRUCTIONS = `Swims are built from blocks: per day "swimming" lists the blocks per section as "id:meters:minutes" (minutes include rest), with ":equipment" when a block uses equipment. Pick exactly one warm-up, one technique, one endurance ("main") and one cool-down block. A hard day also needs one speed block; an easy or long day has none ("s0"). Fill the blocks into "idTemplate" to get the workoutId, e.g. "swim_25_i_w2_t4_m1_s0_c1". The sum of the block minutes, rounded up to a multiple of 5, must not be more than "maxMinutes"; keep a few minutes margin. Use a different technique block on each day and compared to last week, and use the athlete's equipment ("ownedEquipment") in most swims.`;

export function buildSpecialistMessage(
  sport: PlannableSport,
  assignments: Assignment[],
  input: PlannerInput,
  context: PlanningContext,
  coach: CoachContext,
): string {
  const background = weekBackground(input, context, coach);
  const days = assignments.map(({ day, kind, note }) => {
    const base = { date: day.date, weekday: weekdays[isoWeekday(day.date) - 1], kind, headCoachNote: note };
    if (sport === "swimming") return { ...base, swimming: swimOptions(context, day, kind === "hard") };
    return {
      ...base,
      options: dayCandidates(context, day)
        .filter((candidate) => candidate.workout.sport === sport && candidate.kind === kind)
        .map((candidate) => `${candidate.workout.id}:${candidate.minutes}`),
    };
  });
  const message = {
    language: background.language,
    today: background.today,
    athlete: background.athlete,
    goal: background.goal,
    alreadyPlanned: background.alreadyPlanned,
    lastWeek: input.recentTemplateIds.filter((id) => getWorkout(id)?.sport === sport),
    lastWeekFeedback: background.lastWeekFeedback,
    yourDays: days,
  };
  const instructions = sport === "swimming" ? `${SPECIALIST_INSTRUCTIONS}\n\n${SWIM_INSTRUCTIONS}` : SPECIALIST_INSTRUCTIONS;
  return `${instructions}\n\nYour days:\n${JSON.stringify(message)}`;
}

/** The sports that got days in the outline, in a fixed order. */
export function sportsInOutline(assignments: Assignment[]): PlannableSport[] {
  return plannableSports.filter((sport) => assignments.some((item) => item.sport === sport));
}

/**
 * The final sessions: per assigned day the specialist's workout when it fits the
 * day, sport and kind, otherwise the rule-based planner's pick (with the head
 * coach's note as reason). A specialist that didn't answer counts as no answer.
 */
export function sessionsFromTeam(
  input: PlannerInput,
  context: PlanningContext,
  assignments: Assignment[],
  answers: Partial<Record<PlannableSport, SpecialistAnswer | null>>,
): (PlannedSession & { reason: string })[] {
  const used = new Set<string>();
  const recent = new Set(input.recentTemplateIds);
  const sessions: (PlannedSession & { reason: string })[] = [];

  for (const { day, sport, kind, note } of assignments) {
    const answer = answers[sport]?.sessions.find((session) => session.date === day.date);
    const chosen = answer
      ? dayCandidates(context, day).find(
          (candidate) =>
            candidate.workout.id === answer.workoutId &&
            candidate.workout.sport === sport &&
            candidate.kind === kind &&
            !used.has(candidate.workout.id),
        )
      : undefined;
    const pick =
      chosen ?? pickWorkout(sport, context.levels.get(sport)!, day.minutes, kind, context.swim, used, recent, context.limits);
    if (!pick) continue;
    used.add(pick.workout.id);
    sessions.push({
      scheduledOn: day.date,
      sport,
      templateId: pick.workout.id,
      durationMinutes: pick.minutes,
      reason: (chosen && answer ? answer.reason : note).trim().slice(0, MAX_REASON_LENGTH),
    });
  }
  return sessions;
}
