import { triathlonSports, type Sport } from "./training";

// Upper limit for a single distance: 1,000 km.
export const MAX_GOAL_DISTANCE_M = 1_000_000;

export const goalCategories = ["triathlon", "running", "cycling", "swimming", "other"] as const;
export type GoalCategory = (typeof goalCategories)[number];
/** Categories that have distances ("other" doesn't). */
export type DistanceCategory = Exclude<GoalCategory, "other">;

/** Which distance fields each category has, in race order. */
export const categorySports: Record<DistanceCategory, readonly Sport[]> = {
  triathlon: triathlonSports,
  running: ["running"],
  cycling: ["cycling"],
  swimming: ["swimming"],
};

/** One part of a goal, e.g. the swim of a triathlon. Always in meters. */
export type Segment = { sport: Sport; distanceMeters: number };

type RacePresetDefinition = {
  key: string;
  category: DistanceCategory;
  segments: readonly Segment[];
};

const swim = (distanceMeters: number) => ({ sport: "swimming", distanceMeters }) as const;
const bike = (distanceMeters: number) => ({ sport: "cycling", distanceMeters }) as const;
const run = (distanceMeters: number) => ({ sport: "running", distanceMeters }) as const;

// Every key needs a label and description in messages/*.json under "RacePresets".
export const racePresets = [
  { key: "sprint_triathlon", category: "triathlon", segments: [swim(750), bike(20_000), run(5_000)] },
  { key: "olympic_triathlon", category: "triathlon", segments: [swim(1_500), bike(40_000), run(10_000)] },
  { key: "ironman_70_3", category: "triathlon", segments: [swim(1_900), bike(90_000), run(21_098)] },
  { key: "ironman", category: "triathlon", segments: [swim(3_800), bike(180_000), run(42_195)] },
  { key: "run_5k", category: "running", segments: [run(5_000)] },
  { key: "run_10k", category: "running", segments: [run(10_000)] },
  { key: "half_marathon", category: "running", segments: [run(21_098)] },
  { key: "marathon", category: "running", segments: [run(42_195)] },
  { key: "ride_50k", category: "cycling", segments: [bike(50_000)] },
  { key: "ride_100k", category: "cycling", segments: [bike(100_000)] },
  { key: "ride_160k", category: "cycling", segments: [bike(160_000)] },
  { key: "swim_1k", category: "swimming", segments: [swim(1_000)] },
  { key: "swim_2_5k", category: "swimming", segments: [swim(2_500)] },
  { key: "swim_5k", category: "swimming", segments: [swim(5_000)] },
] as const satisfies readonly RacePresetDefinition[];

export type RacePreset = (typeof racePresets)[number];
export type RacePresetKey = RacePreset["key"];

export const CUSTOM_PRESET = "custom";
export type GoalPresetChoice = RacePresetKey | typeof CUSTOM_PRESET;

export function presetsFor(category: DistanceCategory): RacePreset[] {
  return racePresets.filter((preset) => preset.category === category);
}

export function findPreset(key: string | null): RacePreset | undefined {
  return racePresets.find((preset) => preset.key === key);
}

export function isGoalPresetChoice(value: string): value is GoalPresetChoice {
  return value === CUSTOM_PRESET || findPreset(value) !== undefined;
}

/** Swimming distances are entered in meters, everything else in kilometers. */
export function distanceUnit(sport: Sport): "m" | "km" {
  return sport === "swimming" ? "m" : "km";
}

/**
 * Turns what the user typed into meters, or null when it isn't a valid distance.
 * Accepts both "21.1" and the Dutch "21,1".
 */
export function parseDistanceInput(sport: Sport, text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;

  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;

  const meters = Math.round(distanceUnit(sport) === "km" ? value * 1000 : value);
  return meters > 0 && meters <= MAX_GOAL_DISTANCE_M ? meters : null;
}
