import type { DayAvailability } from "./availability";
import type { SeasonWeek } from "./periodization";
import { addDays, daysBetween } from "./dates";
import type { ExperienceLevel, Sport } from "./training";
import { estimatedMinutes } from "./workouts/estimate";
import { getWorkout, workoutsForSport } from "./workouts/library";
import { usedEquipment, type Equipment, type PoolLength } from "./workouts/swim";
import { parseSwimWorkoutId, swimWorkouts } from "./workouts/swimTraining";
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
  // A pool session including warm-up, technique and cool-down.
  swimming: {
    beginner: { normal: 45, long: 45 },
    intermediate: { normal: 60, long: 60 },
    advanced: { normal: 75, long: 75 },
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
  /** Your pool and swim equipment. Without it: a 25 m pool and no equipment. */
  swim?: SwimSettings;
  /** Where this week sits in the training blocks (core/periodization.ts): how much to train and how hard. */
  season?: SeasonWeek;
};

/** Limits from the training block: the hardest workout allowed and how long the long sessions get. */
export type PlanLimits = { maxHardDifficulty?: number; longFactor?: number };

export type SwimSettings = { poolLength: PoolLength; equipment: Equipment[] };
const DEFAULT_SWIM: SwimSettings = { poolLength: 25, equipment: [] };

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
  swim: SwimSettings;
  limits: PlanLimits;
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
    // The training block decides how much of the available time to use, e.g. 60% in a recovery week.
    const minutes = input.season ? Math.floor((day.minutes * input.season.volume) / 5) * 5 : day.minutes;
    if (minutes === 0) return;
    days.push({ date, minutes, options, long, canBeHard: long === null && !closeToRace });
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
  // The training block may allow fewer, e.g. none in a recovery week.
  const blockHard = input.season?.hardSessions ?? MAX_HARD_PER_WEEK;
  const hardAllowed = Math.max(
    0,
    Math.min(MAX_HARD_PER_WEEK, blockHard, Math.floor(totalSessions / 3)) - existingHardDates.size,
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
    swim: input.swim ?? DEFAULT_SWIM,
    limits: input.season
      ? { maxHardDifficulty: input.season.maxHardDifficulty, longFactor: input.season.longFactor }
      : {},
  };
}

/**
 * The workouts the planner chooses from. Swims are built from blocks for your pool
 * and equipment; the other sports come from the library files.
 */
function plannableWorkouts(sport: PlannableSport, level: ExperienceLevel, swim: SwimSettings): Workout[] {
  return sport === "swimming"
    ? swimWorkouts(level, swim.poolLength, swim.equipment)
    : workoutsForSport(sport);
}

/** All workouts of this kind that fit in the time and suit the level. */
export function fittingWorkouts(
  sport: PlannableSport,
  level: ExperienceLevel,
  availableMinutes: number,
  kind: Kind,
  swim: SwimSettings = DEFAULT_SWIM,
  limits: PlanLimits = {},
): Candidate[] {
  const maxMinutes = maxSessionMinutes(sport, level, availableMinutes, kind, limits);
  const hardest = Math.min(maxDifficulty[level], limits.maxHardDifficulty ?? 5);

  return plannableWorkouts(sport, level, swim).flatMap((workout) => {
    // Distance runs and rides have no known duration, so they never fit a time slot.
    const minutes = estimatedMinutes(workout, level);
    if (minutes === null || minutes > maxMinutes) return [];
    const fitsKind =
      kind === "hard"
        ? isHardWorkout(workout) && workout.difficulty <= hardest
        : !isHardWorkout(workout);
    return fitsKind ? [{ workout, minutes, kind }] : [];
  });
}

/** The longest session allowed: the time of the day, capped per sport and level. */
export function maxSessionMinutes(
  sport: PlannableSport,
  level: ExperienceLevel,
  availableMinutes: number,
  kind: Kind,
  limits: PlanLimits = {},
): number {
  const caps = sessionCaps[sport][level];
  // Long sessions grow over the season: early on they're shorter than their longest.
  const long = Math.max(caps.normal, Math.round((caps.long * (limits.longFactor ?? 1)) / 5) * 5);
  return Math.min(availableMinutes, kind === "long" ? long : caps.normal);
}

/**
 * The workouts allowed on one day. On a long session day: only the long session
 * (unless it doesn't fit, then a normal easy session). Other days: easy sessions of
 * every allowed sport, and hard ones when the day may be hard.
 */
export function dayCandidates(context: PlanningContext, day: OpenDay): Candidate[] {
  if (day.long !== null) {
    const long = fittingWorkouts(day.long, context.levels.get(day.long)!, day.minutes, "long", context.swim, context.limits);
    if (long.length > 0) return long;
  }
  return day.options.flatMap((sport) => {
    const level = context.levels.get(sport)!;
    const easy = fittingWorkouts(sport, level, day.minutes, "easy", context.swim, context.limits);
    return day.canBeHard
      ? [...easy, ...fittingWorkouts(sport, level, day.minutes, "hard", context.swim, context.limits)]
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
      pickWorkout(mainSport(day), levels.get(mainSport(day))!, day.minutes, "hard", context.swim, undefined, undefined, context.limits) !== null,
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
    const pick = pickWorkout(sport, levels.get(sport)!, day.minutes, "hard", context.swim, used, recent, context.limits)!;
    used.add(pick.workout.id);
    picks.set(day.date, toSession(day.date, sport, pick));
  }
  for (const day of days.filter((item) => !hardDays.has(item))) {
    for (const sport of choices.get(day.date)!) {
      const kind: Kind = sport === day.long ? "long" : "easy";
      const pick = pickWorkout(sport, levels.get(sport)!, day.minutes, kind, context.swim, used, recent, context.limits);
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

/** How many alternatives "Swap" offers. */
export const MAX_ALTERNATIVES = 8;

/**
 * Other library workouts that can replace this one: same sport, same kind (easy,
 * hard or long session), suited to the level and fitting the day. Closest in
 * length first, so a swap doesn't change the week too much.
 */
export function workoutAlternatives(
  current: Workout,
  level: ExperienceLevel,
  availableMinutes: number,
  isLongSession: boolean,
  swim: SwimSettings = DEFAULT_SWIM,
): Candidate[] {
  if (!isPlannable(current.sport)) return [];
  const currentMinutes = estimatedMinutes(current, level) ?? 0;
  const kind: Kind = isLongSession ? "long" : isHardWorkout(current) ? "hard" : "easy";
  // At least as much time as the current workout, also on a day with less time set.
  const minutes = Math.max(availableMinutes, currentMinutes);
  // A block swim: offer the same training with one block changed (another technique,
  // endurance or speed block), in the pool it was planned for.
  const composition = parseSwimWorkoutId(current.id);
  const settings = composition ? { ...swim, poolLength: composition.poolLength } : swim;
  return fittingWorkouts(current.sport, level, minutes, kind, settings)
    .filter((candidate) => candidate.workout.id !== current.id)
    .filter((candidate) => composition === null || differsInOneBlock(composition, candidate.workout.id))
    .sort(
      (a, b) =>
        Math.abs(a.minutes - currentMinutes) - Math.abs(b.minutes - currentMinutes) ||
        b.minutes - a.minutes ||
        a.workout.difficulty - b.workout.difficulty,
    )
    .slice(0, MAX_ALTERNATIVES);
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
  swim: SwimSettings = DEFAULT_SWIM,
  used: Set<string> = new Set(),
  recent: Set<string> = new Set(),
  limits: PlanLimits = {},
): Candidate | null {
  // Swims are compared per block, so the week gets different drills and sets.
  const usedParts = new Set([...used].flatMap(varietyParts));
  const recentParts = new Set([...recent].flatMap(varietyParts));
  const overlap = (id: string, parts: Set<string>) => varietyParts(id).filter((part) => parts.has(part)).length;
  // If you own swim equipment, use it: a swim without any comes after one with.
  const skipsGear = (workout: Workout) =>
    workout.sport === "swimming" && swim.equipment.length > 0 && usedEquipment(workout.steps).length === 0 ? 1 : 0;
  const score = ({ workout, minutes }: Candidate) => [
    overlap(workout.id, usedParts),
    skipsGear(workout),
    -minutes,
    overlap(workout.id, recentParts),
    // Hard: the hardest allowed. Easy: the calmest.
    kind === "hard" ? -workout.difficulty : workout.difficulty,
  ];
  const candidates = fittingWorkouts(sport, level, availableMinutes, kind, swim, limits);
  candidates.sort((a, b) => compareScores(score(a), score(b)));
  return candidates[0] ?? null;
}

/** What makes a workout feel the same: a library workout itself, or a swim's technique, endurance and speed blocks. */
function varietyParts(id: string): string[] {
  const swim = parseSwimWorkoutId(id);
  return swim ? [swim.technique, swim.main, swim.speed ?? "s0"] : [id];
}

function differsInOneBlock(current: { technique: string; main: string; speed: string | null }, id: string): boolean {
  const other = parseSwimWorkoutId(id);
  if (!other) return false;
  const changes = [
    other.technique !== current.technique,
    other.main !== current.main,
    other.speed !== current.speed,
  ].filter(Boolean).length;
  return changes === 1;
}
