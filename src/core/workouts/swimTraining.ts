import type { ExperienceLevel } from "@/core/training";
import { restSeconds, swimPaceSecondsPer100 } from "./estimate";
import { usedEquipment, type Equipment, type PoolLength } from "./swim";
import { blocksForSection, getSwimBlock, type SwimBlock, type SwimSection } from "./swimBlocks";
import type { LocalizedText, Workout, WorkoutCategory, WorkoutStep } from "./types";

// A swim training is a combination of blocks (see swimBlocks.ts). Its id says which
// ones, so it can be stored like any library workout and rebuilt from the id:
//
//   swim_25_i_w2_t4_m1_s3_c1  =  25 m pool, intermediate, warm-up 2, technique 4,
//                                endurance 1, speed 3 (s0 = none), cool-down 1

export type SwimComposition = {
  poolLength: PoolLength;
  level: ExperienceLevel;
  warmup: string;
  technique: string;
  main: string;
  /** null = an easy training without a speed block. */
  speed: string | null;
  cooldown: string;
};

const levelCodes: Record<ExperienceLevel, string> = { beginner: "b", intermediate: "i", advanced: "a" };
const ID_PATTERN = /^swim_(25|50)_([bia])_(w\d+)_(t\d+)_(m\d+)_(s\d+)_(c\d+)$/;

export function swimWorkoutId(composition: SwimComposition): string {
  const { poolLength, level, warmup, technique, main, speed, cooldown } = composition;
  return `swim_${poolLength}_${levelCodes[level]}_${warmup}_${technique}_${main}_${speed ?? "s0"}_${cooldown}`;
}

/** Reads a swim training id; null when it isn't one or names blocks that don't exist. */
export function parseSwimWorkoutId(id: string): SwimComposition | null {
  const match = ID_PATTERN.exec(id);
  if (!match) return null;
  const [, pool, levelCode, warmup, technique, main, speed, cooldown] = match;
  const level = (Object.keys(levelCodes) as ExperienceLevel[]).find((key) => levelCodes[key] === levelCode)!;
  const composition: SwimComposition = {
    poolLength: pool === "50" ? 50 : 25,
    level,
    warmup,
    technique,
    main,
    speed: speed === "s0" ? null : speed,
    cooldown,
  };
  return blocksOf(composition) ? composition : null;
}

/** The blocks in training order, or null if one is missing, in the wrong section or not for this level. */
function blocksOf(composition: SwimComposition): SwimBlock[] | null {
  const wanted: [SwimSection, string | null][] = [
    ["warmup", composition.warmup],
    ["technique", composition.technique],
    ["main", composition.main],
    ["speed", composition.speed],
    ["cooldown", composition.cooldown],
  ];
  const blocks: SwimBlock[] = [];
  for (const [section, id] of wanted) {
    if (id === null) continue;
    const block = getSwimBlock(id);
    if (!block || block.section !== section || !block.levels.includes(composition.level)) return null;
    blocks.push(block);
  }
  return blocks;
}

function totalMeters(steps: WorkoutStep[]): number {
  return steps.reduce(
    (total, step) =>
      total + (step.type === "repeat" ? step.times * totalMeters(step.steps) : (step.distanceMeters ?? 0)),
    0,
  );
}

function category(speed: SwimBlock | undefined): WorkoutCategory {
  if (!speed) return "endurance";
  return speed.difficulty >= 5 ? "vo2max" : speed.difficulty === 4 ? "threshold" : "tempo";
}

const join = (texts: LocalizedText[], separator: string): LocalizedText => ({
  nl: texts.map((text) => text.nl).join(separator),
  en: texts.map((text) => text.en).join(separator),
});

/** Builds the full training from its blocks. */
export function composeSwimWorkout(composition: SwimComposition): Workout | null {
  const blocks = blocksOf(composition);
  if (!blocks) return null;
  const sections = blocks.map((block) => ({
    section: block.section,
    blockId: block.id,
    name: block.name,
    steps: block.steps(composition.poolLength, composition.level),
  }));
  const steps = sections.flatMap((section) => section.steps);
  const meters = totalMeters(steps);
  const speed = blocks.find((block) => block.section === "speed");
  // The name shows what makes this training different: technique, endurance and speed.
  const named = blocks.filter((block) => ["technique", "main", "speed"].includes(block.section));

  return {
    id: swimWorkoutId(composition),
    sport: "swimming",
    category: category(speed),
    difficulty: speed ? speed.difficulty : 2,
    name: join(
      named.map((block) => block.name),
      " · ",
    ),
    description: {
      nl: `Inzwemmen, techniek, ${speed ? "duur en snelheid" : "duur"} en uitzwemmen. Totaal ${meters} m in een ${composition.poolLength}m-bad.`,
      en: `Warm-up, technique, ${speed ? "endurance and speed" : "endurance"} and cool-down. ${meters} m in total in a ${composition.poolLength} m pool.`,
    },
    target: "distance",
    durationMinutes: null,
    distanceMeters: meters,
    steps,
    swim: { poolLength: composition.poolLength, level: composition.level, sections },
  };
}

export function getSwimWorkout(id: string): Workout | null {
  const composition = parseSwimWorkoutId(id);
  return composition ? composeSwimWorkout(composition) : null;
}

/** True when you own everything the training needs. */
export function hasEquipmentFor(workout: Workout, owned: Equipment[]): boolean {
  return usedEquipment(workout.steps).every((item) => owned.includes(item));
}

/**
 * Every swim training possible for this level and pool with the equipment you own.
 * Without speed block = easy; with one = hard.
 */
// The planner asks for the same list many times while planning one week, so it is built once.
const swimWorkoutsCache = new Map<string, Workout[]>();

export function swimWorkouts(level: ExperienceLevel, poolLength: PoolLength, owned: Equipment[]): Workout[] {
  const key = [level, poolLength, ...[...owned].sort()].join("|");
  const cached = swimWorkoutsCache.get(key);
  if (cached) return cached;

  const allowed = (section: SwimSection) =>
    blocksForSection(section).filter((block) => block.levels.includes(level));
  const speeds: (string | null)[] = [null, ...allowed("speed").map((block) => block.id)];

  const workouts: Workout[] = [];
  for (const warmup of allowed("warmup"))
    for (const technique of allowed("technique"))
      for (const main of allowed("main"))
        for (const speed of speeds)
          for (const cooldown of allowed("cooldown")) {
            const workout = composeSwimWorkout({
              poolLength,
              level,
              warmup: warmup.id,
              technique: technique.id,
              main: main.id,
              speed,
              cooldown: cooldown.id,
            });
            if (workout && hasEquipmentFor(workout, owned)) workouts.push(workout);
          }
  swimWorkoutsCache.set(key, workouts);
  return workouts;
}

/** The same training in the other pool, e.g. when you swim in a 50 m pool for once. */
export function swimWorkoutInPool(id: string, poolLength: PoolLength): string | null {
  const composition = parseSwimWorkoutId(id);
  return composition ? swimWorkoutId({ ...composition, poolLength }) : null;
}

/** One block as the AI coach sees it: "t4:300m:7.5min:fins" (minutes including rests). */
export type SwimBlockOption = { id: string; meters: number; minutes: number; equipment: Equipment[] };

/** Per section, the blocks this athlete may get: right level, pool and own equipment. */
export function swimBlockOptions(
  level: ExperienceLevel,
  poolLength: PoolLength,
  owned: Equipment[],
): Record<SwimSection, SwimBlockOption[]> {
  const options = {} as Record<SwimSection, SwimBlockOption[]>;
  for (const section of ["warmup", "technique", "main", "speed", "cooldown"] as const) {
    options[section] = blocksForSection(section).flatMap((block) => {
      if (!block.levels.includes(level)) return [];
      const steps = block.steps(poolLength, level);
      const equipment = usedEquipment(steps);
      if (!equipment.every((item) => owned.includes(item))) return [];
      const meters = totalMeters(steps);
      const seconds = (meters / 100) * swimPaceSecondsPer100[level] + restSeconds(steps);
      return [{ id: block.id, meters, minutes: Math.round((seconds / 60) * 10) / 10, equipment }];
    });
  }
  return options;
}

/** The id pattern the AI coach fills in, e.g. "swim_25_i_{warmup}_{technique}_{main}_{speed|s0}_{cooldown}". */
export function swimIdTemplate(level: ExperienceLevel, poolLength: PoolLength): string {
  return `swim_${poolLength}_${levelCodes[level]}_{warmup}_{technique}_{main}_{speed or s0}_{cooldown}`;
}

/**
 * A short list of swims to choose from when adding one yourself: one per endurance
 * block and speed choice, each with another technique block.
 */
export function swimSuggestions(level: ExperienceLevel, poolLength: PoolLength, owned: Equipment[]): Workout[] {
  const all = swimWorkouts(level, poolLength, owned);
  const parts = all.map((workout) => ({ workout, composition: parseSwimWorkoutId(workout.id)! }));
  const techniques = [...new Set(parts.map((part) => part.composition.technique))];
  const keys = [...new Set(parts.map((part) => `${part.composition.main}|${part.composition.speed}`))];

  return keys.flatMap((key, index) => {
    const matching = parts.filter((part) => `${part.composition.main}|${part.composition.speed}` === key);
    const technique = techniques[index % techniques.length];
    const pick = matching.find((part) => part.composition.technique === technique) ?? matching[0];
    return pick ? [pick.workout] : [];
  });
}
