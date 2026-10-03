import { addDays, daysBetween, startOfWeek } from "./dates";
import type { RacePresetKey } from "./racePresets";

// Periodisation: training in blocks, building up over the whole season.
//
// With a goal, the weeks from the moment you set it up to race day are split,
// counting back from the race:
//   race week ← taper (1-3 weeks) ← peak block ← build blocks ← base blocks
// Every block is 3 weeks building and 1 week recovery (2 + 1 for beginners); the
// peak block has no recovery week, the taper takes that role.
//
// The volume grows over the whole season, not only within a block: the first
// block starts low and every block peaks a bit higher, up to 100% in the peak
// block. So a race a year away starts with months of easy base, and intensity
// follows the phase: base only tempo, build adds threshold, peak everything.
//
// Without a goal you keep training in the same 3 + 1 rhythm to stay fit.
// Pure logic: the planner and the coaches use the week it returns.

export type Phase = "base" | "build" | "peak" | "taper" | "race" | "maintain";
export type WeekType = "build" | "recovery" | "taper" | "race";

export type SeasonWeek = {
  /** Monday of the week. */
  weekStart: string;
  phase: Phase;
  type: WeekType;
  /** Block number from 1 (taper and race week belong to no block: 0). */
  block: number;
  /** Week within the block, from 1, and the block's length. */
  weekInBlock: number;
  blockLength: number;
  /** Share of the athlete's available time to fill, 0-1. */
  volume: number;
  /** How many hard sessions this week may have at most. */
  hardSessions: number;
  /** The hardest workout difficulty (1-5) this phase allows. */
  maxHardDifficulty: number;
  /** Long sessions scale with this, 0-1 of their longest. */
  longFactor: number;
};

/** Taper length per race: short races 1 week, the longest 3. */
const TAPER_WEEKS: Record<RacePresetKey, number> = {
  sprint_triathlon: 1,
  run_5k: 1,
  ride_50k: 1,
  swim_1k: 1,
  olympic_triathlon: 2,
  run_10k: 2,
  half_marathon: 2,
  ironman_70_3: 2,
  ride_100k: 2,
  swim_2_5k: 2,
  marathon: 3,
  ironman: 3,
  ride_160k: 3,
  swim_5k: 3,
};
const DEFAULT_TAPER_WEEKS = 2;

/** Volume per taper week (as share of the peak), e.g. 3 weeks: 75%, 60%, 45%. */
const TAPER_VOLUME: Record<number, number[]> = { 1: [0.6], 2: [0.7, 0.5], 3: [0.75, 0.6, 0.45] };
const RACE_WEEK_VOLUME = 0.35;

/** Within a block: the build weeks rise to the block's peak; the recovery week drops. */
const BUILD_STEPS: Record<number, number[]> = { 2: [0.9, 1], 3: [0.85, 0.93, 1] };
const RECOVERY_VOLUME = 0.6;

/** The first block's peak, as share of the season peak: lower when there's more time. */
const LOWEST_START = 0.55;
const HIGHEST_START = 0.85;
const START_STEP = 0.06;

const PHASE_RULES: Record<Phase, { hardSessions: number; maxHardDifficulty: number }> = {
  base: { hardSessions: 1, maxHardDifficulty: 3 },
  build: { hardSessions: 2, maxHardDifficulty: 4 },
  peak: { hardSessions: 2, maxHardDifficulty: 5 },
  taper: { hardSessions: 1, maxHardDifficulty: 4 },
  race: { hardSessions: 0, maxHardDifficulty: 3 },
  maintain: { hardSessions: 2, maxHardDifficulty: 4 },
};

const round = (value: number) => Math.round(value * 100) / 100;

export type SeasonInput = {
  /** When the goal was set: the season starts that week. */
  goalCreatedOn: string;
  eventDate: string;
  racePreset: string | null;
  /** Beginners train in blocks of 2 + 1 instead of 3 + 1. */
  beginner: boolean;
  /** Weeks (Mondays) the athlete turned into a recovery week. */
  recoveryOverrides?: string[];
};

/** The block length: 3 build + 1 recovery, or 2 + 1 for beginners. */
export function buildWeeksPerBlock(beginner: boolean): number {
  return beginner ? 2 : 3;
}

/** All weeks from the week the goal was set up to race week, with phase, type and load. */
export function seasonPlan(input: SeasonInput): SeasonWeek[] {
  const raceWeek = startOfWeek(input.eventDate);
  const firstWeek = startOfWeek(input.goalCreatedOn < input.eventDate ? input.goalCreatedOn : input.eventDate);
  const totalWeeks = daysBetween(firstWeek, raceWeek) / 7 + 1;
  const buildWeeks = buildWeeksPerBlock(input.beginner);
  const taperWeeks = Math.min(TAPER_WEEKS[input.racePreset as RacePresetKey] ?? DEFAULT_TAPER_WEEKS, Math.max(0, totalWeeks - 1));
  const trainingWeeks = totalWeeks - 1 - taperWeeks;

  // Count back from the taper: the peak block (build weeks only), then full blocks.
  // Weeks left over at the start are added to the first block as easy lead-in weeks.
  const blockLengths: { length: number; withRecovery: boolean }[] = [];
  let left = trainingWeeks;
  if (left > 0) {
    const peak = Math.min(buildWeeks, left);
    blockLengths.unshift({ length: peak, withRecovery: false });
    left -= peak;
  }
  while (left >= buildWeeks + 1) {
    blockLengths.unshift({ length: buildWeeks + 1, withRecovery: true });
    left -= buildWeeks + 1;
  }
  if (left > 0) {
    if (blockLengths.length > 1) blockLengths[0] = { ...blockLengths[0], length: blockLengths[0].length + left };
    else blockLengths.unshift({ length: left, withRecovery: false });
  }

  // Each block peaks a bit higher than the one before, up to 100% in the peak block.
  const blocks = blockLengths.length;
  const start = Math.min(HIGHEST_START, Math.max(LOWEST_START, 1 - START_STEP * (blocks - 1)));
  const blockPeak = (index: number) => (blocks <= 1 ? 1 : start + ((1 - start) * index) / (blocks - 1));
  // The first ~40% of the blocks before the peak are base, the rest build.
  const baseBlocks = blocks <= 2 ? 0 : Math.round((blocks - 1) * 0.4);

  const weeks: SeasonWeek[] = [];
  let weekStart = firstWeek;
  blockLengths.forEach(({ length, withRecovery }, index) => {
    const phase: Phase = index === blocks - 1 ? "peak" : index < baseBlocks ? "base" : "build";
    const peak = blockPeak(index);
    const steps = BUILD_STEPS[buildWeeks];
    const buildCount = withRecovery ? length - 1 : length;
    for (let week = 1; week <= length; week++) {
      const isRecovery = withRecovery && week === length;
      // A short block uses the last steps, so it still ends at its peak; lead-in weeks
      // of a longer first block repeat the first step.
      const step = steps[Math.max(0, steps.length - buildCount + week - 1)] ?? 1;
      const volume = round(peak * (isRecovery ? RECOVERY_VOLUME : step));
      weeks.push({
        weekStart,
        phase,
        type: isRecovery ? "recovery" : "build",
        block: index + 1,
        weekInBlock: week,
        blockLength: length,
        volume,
        hardSessions: isRecovery ? 0 : PHASE_RULES[phase].hardSessions,
        maxHardDifficulty: PHASE_RULES[phase].maxHardDifficulty,
        longFactor: Math.max(0.5, volume),
      });
      weekStart = addDays(weekStart, 7);
    }
  });

  TAPER_VOLUME[taperWeeks]?.forEach((volume, index) => {
    weeks.push({
      weekStart,
      phase: "taper",
      type: "taper",
      block: 0,
      weekInBlock: index + 1,
      blockLength: taperWeeks,
      volume,
      hardSessions: PHASE_RULES.taper.hardSessions,
      maxHardDifficulty: PHASE_RULES.taper.maxHardDifficulty,
      longFactor: Math.max(0.5, volume),
    });
    weekStart = addDays(weekStart, 7);
  });

  weeks.push({
    weekStart: raceWeek,
    phase: "race",
    type: "race",
    block: 0,
    weekInBlock: 1,
    blockLength: 1,
    volume: RACE_WEEK_VOLUME,
    hardSessions: 0,
    maxHardDifficulty: PHASE_RULES.race.maxHardDifficulty,
    longFactor: 0.5,
  });

  return applyRecoveryOverrides(weeks, input.recoveryOverrides ?? []);
}

/**
 * Weeks the athlete turned into a recovery week (e.g. a heavy work week). The
 * block's planned recovery week then becomes a build week, so the block keeps
 * one recovery week; in a block without one, the week simply becomes recovery.
 */
function applyRecoveryOverrides(weeks: SeasonWeek[], overrides: string[]): SeasonWeek[] {
  const result = weeks.map((week) => ({ ...week }));
  for (const monday of overrides) {
    const week = result.find((item) => item.weekStart === monday);
    if (!week || week.type !== "build") continue;
    const planned = result.find(
      (item) => item.block === week.block && item.type === "recovery" && item.weekStart > week.weekStart,
    );
    if (planned) {
      // Swap: the planned recovery week gets this week's load.
      planned.type = "build";
      planned.volume = week.volume;
      planned.hardSessions = week.hardSessions;
      planned.longFactor = week.longFactor;
    }
    week.type = "recovery";
    // About as light as a planned recovery week.
    week.volume = round(week.volume * 0.65);
    week.hardSessions = 0;
    week.longFactor = Math.max(0.5, week.volume);
  }
  return result;
}

/** Monday 4 January 2027: the fixed start of the 3 + 1 rhythm without a goal. */
const MAINTAIN_EPOCH = "2027-01-04";

/** Without a goal: a steady rhythm of build weeks and a recovery week, at a moderate load. */
export function maintainWeek(weekStart: string, beginner: boolean, recoveryOverrides: string[] = []): SeasonWeek {
  const length = buildWeeksPerBlock(beginner) + 1;
  const index = (((daysBetween(MAINTAIN_EPOCH, weekStart) / 7) % length) + length) % length;
  const isRecovery = index === length - 1 || recoveryOverrides.includes(weekStart);
  const volume = isRecovery ? 0.6 : (BUILD_STEPS[length - 1][index] ?? 1) * 0.9;
  return {
    weekStart,
    phase: "maintain",
    type: isRecovery ? "recovery" : "build",
    block: 0,
    weekInBlock: index + 1,
    blockLength: length,
    volume: round(volume),
    hardSessions: isRecovery ? 0 : PHASE_RULES.maintain.hardSessions,
    maxHardDifficulty: PHASE_RULES.maintain.maxHardDifficulty,
    longFactor: Math.max(0.5, round(volume)),
  };
}

/** The season week for a date: from the plan when there's a goal ahead, otherwise the steady rhythm. */
export function seasonWeekFor(
  weekStart: string,
  plan: SeasonWeek[] | null,
  beginner: boolean,
  recoveryOverrides: string[] = [],
): SeasonWeek {
  return plan?.find((week) => week.weekStart === weekStart) ?? maintainWeek(weekStart, beginner, recoveryOverrides);
}
