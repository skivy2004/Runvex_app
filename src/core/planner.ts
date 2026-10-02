import type { DayAvailability } from "./availability";
import { addDays, daysBetween } from "./dates";
import type { ExperienceLevel, Sport } from "./training";
import { estimatedMinutes } from "./workouts/estimate";
import { getWorkout, workoutsForSport } from "./workouts/library";
import type { Workout } from "./workouts/types";

// Week planning rules. The rule-based planner (planWeek) fills the open training
// days of one week with library workouts. The AI coach chooses itself, but its
// answer must pass checkPlan, which uses the same rules. Pure logic, no database.

/** Sports the planner can fill. Strength training is free-form for now (see TODO.md). */
export const plannableSports = ["running", "cycling", "swimming"] as const;
export type PlannableSport = (typeof plannableSports)[number];

/** Workouts from this difficulty up (tempo, threshold, VO2max) count as hard. */
export const HARD_DIFFICULTY = 3;
export const MAX_HARD_PER_WEEK = 2;

/** The hardest workout each level gets. */
export const maxDifficulty: Record<ExperienceLevel, number> = {
  beginner: 3,
  intermediate: 4,
  advanced: 5,
};

/** Longest normal session and longest long session, in minutes, per sport and level. */
const sessionCaps: Record<PlannableSport, Record<ExperienceLevel, { normal: number; long: number }>> = {
  running: {
    beginner: { normal: 40, long: 60 },
    intermediate: { normal: 60, long: 90 },
    advanced: { normal: 75, long: 90 },
  },
  cycling: {
    beginner: { normal: 60, long: 120 },
    intermediate: { normal: 90, long: 180 },
    advanced: { normal: 120, long: 300 },
  },
  swimming: {
    beginner: { normal: 30, long: 30 },
    intermediate: { normal: 45, long: 45 },
    advanced: { normal: 60, long: 60 },
  },
};

export type PlannerInput = {
  /** Monday of the week to plan. */
  weekStart: string;
  /** Days before today are not planned anymore. */
  today: string;
  /** The usual week, index 0 = Monday. */
  availability: DayAvailability[];
  sports: { sport: Sport; level: ExperienceLevel }[];
  /** Workouts already in this week. Their days are left alone. */
  existing: { scheduledOn: string; sport: Sport; templateId: string | null }[];
  /** Library workouts of last week, so this week can be different. */
  recentTemplateIds: string[];
  goal: { sports: Sport[]; eventDate: string | null } | null;
};

export type PlannedSession = {
  scheduledOn: string;
  sport: PlannableSport;
  templateId: string;
  durationMinutes: number;
};

export type Kind = "easy" | "long" | "hard";

/** A day that can still get a training. */
export type OpenDay = {
  date: string;
  minutes: number;
  /** Sports allowed on this day. */
  options: PlannableSport[];
  /** The long session on this day, if any. */
  long: PlannableSport | null;
  /** False on long session days and in the last days before a race. */
  canBeHard: boolean;
};

/** Everything the rules need to know about one week. */
export type PlanningContext = {
  days: OpenDay[];
  levels: Map<Sport, ExperienceLevel>;
  userSports: PlannableSport[];
  goalSports: Sport[];
  /** The race day, when it falls in this week. */
  raceDate: string | null;
  existingHardDates: Set<string>;
  longDates: Set<string>;
  /** How many hard sessions this plan may add. */
  hardAllowed: number;
};

export type Candidate = { workout: Workout; minutes: number; kind: Kind };

function isPlannable(sport: Sport): sport is PlannableSport {
  return (plannableSports as readonly Sport[]).includes(sport);
}

export function isHardWorkout(workout: Workout): boolean {
  return workout.difficulty >= HARD_DIFFICULTY;
}

export function planningContext(input: PlannerInput): PlanningContext {
  const levels = new Map(input.sports.map((item) => [item.sport, item.level]));
  const userSports = plannableSports.filter((sport) => levels.has(sport));

  // A race in this week: nothing on or after race day, and no hard work in the 2 days before.
  const eventDate = input.goal?.eventDate ?? null;
  const raceOffset = eventDate === null ? -1 : daysBetween(input.weekStart, eventDate);
  const raceDate = raceOffset >= 0 && raceOffset <= 6 ? eventDate : null;

  const takenDates = new Set(input.existing.map((workout) => workout.scheduledOn));
  const days: OpenDay[] = [];
  input.availability.forEach((day, index) => {
    const date = addDays(input.weekStart, index);
    // Only training days that aren't in the past and have nothing planned yet.
    if (day.minutes === 0 || date < input.today || takenDates.has(date)) return;
    if (raceDate !== null && date >= raceDate) return;
    const options = (day.sports.length > 0 ? day.sports : userSports).filter(
      (sport): sport is PlannableSport => isPlannable(sport) && levels.has(sport),
    );
    if (options.length === 0) return;
    const long = day.longSessions.find((sport) => options.includes(sport)) ?? null;
    const closeToRace = raceDate !== null && daysBetween(date, raceDate) <= 2;
    days.push({ date, minutes: day.minutes, options, long, canBeHard: long === null && !closeToRace });
  });

  const existingHardDates = new Set(
    input.existing
      .filter((workout) => {
        const template = workout.templateId ? getWorkout(workout.templateId) : undefined;
        return template !== undefined && isHardWorkout(template);
      })
      .map((workout) => workout.scheduledOn),
  );

  // About 20% hard: one per 3 sessions, at most 2 a week, minus what's already planned.
  const totalSessions = input.existing.length + days.length;
  const hardAllowed = Math.max(
    0,
    Math.min(MAX_HARD_PER_WEEK, Math.floor(totalSessions / 3)) - existingHardDates.size,
  );

  const longDates = new Set(
    input.availability.flatMap((day, index) =>
      day.longSessions.length > 0 ? [addDays(input.weekStart, index)] : [],
    ),
  );

  return {
    days,
    levels,
    userSports,
    goalSports: input.goal?.sports ?? [],
    raceDate,
    existingHardDates,
    longDates,
    hardAllowed,
  };
}

/** All library workouts of this kind that fit in the time and suit the level. */
export function fittingWorkouts(
  sport: PlannableSport,
  level: ExperienceLevel,
  availableMinutes: number,
  kind: Kind,
): Candidate[] {
  const caps = sessionCaps[sport][level];
  const maxMinutes = Math.min(availableMinutes, kind === "long" ? caps.long : caps.normal);

  return workoutsForSport(sport).flatMap((workout) => {
    // Distance runs and rides have no known duration, so they never fit a time slot.
    const minutes = estimatedMinutes(workout, level);
    if (minutes === null || minutes > maxMinutes) return [];
    const fitsKind =
      kind === "hard"
        ? isHardWorkout(workout) && workout.difficulty <= maxDifficulty[level]
        : !isHardWorkout(workout);
    return fitsKind ? [{ workout, minutes, kind }] : [];
  });
}

/**
 * The workouts allowed on one day. On a long session day: only the long session
 * (unless it doesn't fit, then a normal easy session). Other days: easy sessions of
 * every allowed sport, and hard ones when the day may be hard.
 */
export function dayCandidates(context: PlanningContext, day: OpenDay): Candidate[] {
  if (day.long !== null) {
    const long = fittingWorkouts(day.long, context.levels.get(day.long)!, day.minutes, "long");
    if (long.length > 0) return long;
  }
  return day.options.flatMap((sport) => {
    const level = context.levels.get(sport)!;
    const easy = fittingWorkouts(sport, level, day.minutes, "easy");
    return day.canBeHard
      ?[...easy, ...fittingWorkouts(sport, level, day.minutes, "hard")]
      : easy;
  });
}

/**
 * Checks a plan against the rules. Returns what's wrong; an empty list means the
 * plan is fine. Used to check the AI coach's answer before saving it.
 */
export function checkPlan(context: PlanningContext, sessions: PlannedSession[]): string[] {
  const problems: string[] = [];
  const daysByDate = new Map(context.days.map((day) => [day.date, day]));
  const seenDates = new Set<string>();
  const hardDates: string[] = [];

  for (const session of sessions) {
    const day = daysByDate.get(session.scheduledOn);
    if (!day) {
      problems.push(`${session.scheduledOn}: not an open training day`);
      continue;
    }
    if (seenDates.has(session.scheduledOn)) problems.push(`${session.scheduledOn}: more than one session`);
    seenDates.add(session.scheduledOn);

    const candidate = dayCandidates(context, day).find(
      (item) => item.workout.id === session.templateId,
    );
    if (!candidate) {
      problems.push(`${session.scheduledOn}: ${session.templateId} is not allowed on this day`);
      continue;
    }
    if (candidate.workout.sport !== session.sport || candidate.minutes !== session.durationMinutes) {
      problems.push(`${session.scheduledOn}: sport or duration doesn't match ${session.templateId}`);
    }
    if (isHardWorkout(candidate.workout)) hardDates.push(session.scheduledOn);
  }

  if (hardDates.length > context.hardAllowed) {
    problems.push(`${hardDates.length} hard sessions, at most ${context.hardAllowed} allowed`);
  }
  const allHard = [...context.existingHardDates, ...hardDates];
  for (const date of hardDates) {
    if (allHard.some((other) => Math.abs(daysBetween(date, other)) === 1)) {
      problems.push(`${date}: hard session next to another hard day`);
    }
  }
  return problems;
}

/** The rule-based planner. Also the fallback when the AI coach isn't available. */
export function planWeek(input: PlannerInput): PlannedSession[] {
  const context = planningContext(input);
  const { days, levels, userSports, goalSports } = context;

  // Sport per date, from existing workouts and (below) from this plan.
  const sportOn = new Map<string, Sport>();
  for (const workout of input.existing) sportOn.set(workout.scheduledOn, workout.sport);
  const sessionCount = new Map<Sport, number>();
  const countSession = (sport: Sport) => sessionCount.set(sport, (sessionCount.get(sport) ?? 0) + 1);
  input.existing.forEach((workout) => countSession(workout.sport));

  // 1. Choose a sport per day, best first. Fixed days first (long session or one
  //    sport), so the flexible days can balance the sports around them.
  const choices = new Map<string, PlannableSport[]>();
  const isFixed = (day: OpenDay) => day.long !== null || day.options.length === 1;
  for (const day of days.filter(isFixed)) {
    const ordered = day.long !== null ? [day.long, ...day.options.filter((s) => s !== day.long)] : day.options;
    choices.set(day.date, ordered);
    countSession(ordered[0]);
    sportOn.set(day.date, ordered[0]);
  }
  for (const day of days.filter((item) => !isFixed(item))) {
    const yesterday = sportOn.get(addDays(day.date, -1));
    const score = (sport: PlannableSport) => [
      sessionCount.get(sport) ?? 0, // the sport done least this week
      goalSports.includes(sport) ? 0 : 1, // then the sports of the goal
      sport === yesterday ? 1 : 0, // then something else than yesterday
      userSports.indexOf(sport),
    ];
    const ordered = [...day.options].sort((a, b) => compareScores(score(a), score(b)));
    choices.set(day.date, ordered);
    countSession(ordered[0]);
    sportOn.set(day.date, ordered[0]);
  }
  const mainSport = (day: OpenDay) => choices.get(day.date)![0];

  // 2. Pick the hard days. There are at most 7 days, so we simply compare every
  //    combination and keep the best: most hard days, then different sports, then
  //    not next to a long session, then the sports of the goal, then the most time.
  const used = new Set<string>();
  const recent = new Set(input.recentTemplateIds);
  const nextTo = (dates: Set<string>, date: string) =>
    dates.has(addDays(date, -1)) || dates.has(addDays(date, 1));

  const hardCandidates = days.filter(
    (day) =>
      day.canBeHard &&
      !nextTo(context.existingHardDates, day.date) &&
      pickWorkout(mainSport(day), levels.get(mainSport(day))!, day.minutes, "hard") !== null,
  );
  const scoreCombination = (combination: OpenDay[]) => [
    -combination.length,
    -new Set(combination.map(mainSport)).size,
    combination.filter((day) => nextTo(context.longDates, day.date)).length,
    -combination.filter((day) => goalSports.includes(mainSport(day))).length,
    -combination.reduce((total, day) => total + day.minutes, 0),
  ];
  const best = combinations(hardCandidates, context.hardAllowed)
    .filter((combination) => noTwoInARow(combination.map((day) => day.date)))
    .sort((a, b) => compareScores(scoreCombination(a), scoreCombination(b)))[0];
  const hardDays = new Set(best ?? []);

  // 3. Pick the workouts: hard days first, then easy sessions and the long sessions.
  const picks = new Map<string, PlannedSession>();
  for (const day of hardDays) {
    const sport = mainSport(day);
    const pick = pickWorkout(sport, levels.get(sport)!, day.minutes, "hard", used, recent)!;
    used.add(pick.workout.id);
    picks.set(day.date, toSession(day.date, sport, pick));
  }
  for (const day of days.filter((item) => !hardDays.has(item))) {
    for (const sport of choices.get(day.date)!) {
      const kind: Kind = sport === day.long ? "long" : "easy";
      const pick = pickWorkout(sport, levels.get(sport)!, day.minutes, kind, used, recent);
      if (!pick) continue; // doesn't fit, e.g. a 30-minute day for cycling: try the next sport
      used.add(pick.workout.id);
      picks.set(day.date, toSession(day.date, sport, pick));
      break;
    }
  }
  return [...picks.values()].sort((a, b) => a.scheduledOn.localeCompare(b.scheduledOn));
}

function toSession(date: string, sport: PlannableSport, pick: Candidate): PlannedSession {
  return { scheduledOn: date, sport, templateId: pick.workout.id, durationMinutes: pick.minutes };
}

/** All selections of 1 up to `max` items, keeping their order. */
function combinations<T>(items: T[], max: number): T[][] {
  if (max === 0 || items.length === 0) return [];
  const [first, ...rest] = items;
  const withFirst = [[first], ...combinations(rest, max - 1).map((tail) => [first, ...tail])];
  return [...withFirst, ...combinations(rest, max)];
}

function noTwoInARow(dates: string[]): boolean {
  return dates.every((date, i) =>
    dates.every((other, j) => i === j || Math.abs(daysBetween(date, other)) > 1),
  );
}

function compareScores(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * The best library workout for one session: it fits in the time, matches the kind
 * and the level, and is as long as allowed. Workouts already used this week are
 * avoided most, then those of last week.
 */
export function pickWorkout(
  sport: PlannableSport,
  level: ExperienceLevel,
  availableMinutes: number,
  kind: Kind,
  used: Set<string> = new Set(),
  recent: Set<string> = new Set(),
): Candidate | null {
  const score = ({ workout, minutes }: Candidate) => [
    used.has(workout.id) ? 1 : 0,
    -minutes,
    recent.has(workout.id) ? 1 : 0,
    // Hard: the hardest allowed. Easy: the calmest.
    kind === "hard" ? -workout.difficulty : workout.difficulty,
  ];
  const candidates = fittingWorkouts(sport, level, availableMinutes, kind);
  candidates.sort((a, b) => compareScores(score(a), score(b)));
  return candidates[0] ?? null;
}
