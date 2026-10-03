import type { ExperienceLevel } from "@/core/training";
import type { DrillId, Equipment, PoolLength, Stroke } from "./swim";
import type { LocalizedText, WorkoutStep, Zone } from "./types";

// Swim trainings are built from blocks, like a coach's schedule:
//   warm-up → main 1 technique → main 2 endurance → main 3 speed (optional) → cool-down
// Every block adapts to your level (more repeats or longer distances) and to the pool:
// drills always cover whole lengths, so in a 50 m pool you never switch halfway.

export const swimSections = ["warmup", "technique", "main", "speed", "cooldown"] as const;
export type SwimSection = (typeof swimSections)[number];

export type SwimBlock = {
  /** Short id, unique within its section, e.g. "t3". Used in training ids, so never change it. */
  id: string;
  section: SwimSection;
  name: LocalizedText;
  /** 1-2 easy, 3+ hard (only speed blocks are hard). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** Levels that may get this block. */
  levels: ExperienceLevel[];
  steps: (pool: PoolLength, level: ExperienceLevel) => WorkoutStep[];
};

type SingleStep = Exclude<WorkoutStep, { type: "repeat" }>;

type StepOptions = {
  stroke?: Stroke;
  rest?: number;
  equipment?: Equipment[];
};

function swim(meters: number, zone: Zone, options: StepOptions = {}): SingleStep {
  return {
    type: "interval",
    zone,
    durationMinutes: null,
    distanceMeters: meters,
    label: null,
    isWalking: false,
    restSeconds: options.rest ?? null,
    stroke: options.stroke ?? null,
    drill: null,
    equipment: options.equipment ?? [],
  };
}

function drill(id: DrillId, meters: number, options: StepOptions & { zone?: Zone } = {}): SingleStep {
  return { ...swim(meters, options.zone ?? 1, options), drill: id };
}

function repeat(times: number, ...steps: WorkoutStep[]): WorkoutStep {
  return { type: "repeat", times, steps };
}

/** Marks the steps as warm-up or cool-down, so they show up as such. */
function as(type: "warmup" | "cooldown", steps: WorkoutStep[]): WorkoutStep[] {
  return steps.map((step) => (step.type === "repeat" ? step : { ...step, type }));
}

/** Picks the value for the level: beginner, intermediate, advanced. */
function by<T>(level: ExperienceLevel, beginner: T, intermediate: T, advanced: T): T {
  return level === "beginner" ? beginner : level === "intermediate" ? intermediate : advanced;
}

const allLevels: ExperienceLevel[] = ["beginner", "intermediate", "advanced"];
const notBeginner: ExperienceLevel[] = ["intermediate", "advanced"];

/** A technique set: drill one length, then one length of normal freestyle. */
function drillSet(times: number, id: DrillId, pool: PoolLength, equipment: Equipment[] = []): WorkoutStep {
  return repeat(times, drill(id, pool, { equipment }), swim(pool, 1, { stroke: "freestyle", rest: 10 }));
}

export const swimBlocks: SwimBlock[] = [
  // Warm-up
  {
    id: "w1",
    section: "warmup",
    name: { nl: "Rustig inzwemmen", en: "Easy warm-up" },
    difficulty: 1,
    levels: allLevels,
    steps: (_pool, level) => as("warmup", [swim(by(level, 200, 300, 400), 1, { stroke: "freestyle" })]),
  },
  {
    id: "w2",
    section: "warmup",
    name: { nl: "Gemengd inzwemmen", en: "Mixed warm-up" },
    difficulty: 1,
    levels: allLevels,
    steps: (pool, level) =>
      as("warmup", [
        swim(100, 1, { stroke: "freestyle", rest: 10 }),
        repeat(
          by(level, 2, 4, 4),
          swim(pool, 1, { stroke: "breaststroke" }),
          swim(pool, 1, { stroke: "freestyle", rest: 10 }),
        ),
        // Beginners stop after the mixed lengths.
        ...(level === "beginner" ? [] : [swim(by(level, 0, 100, 200), 1, { stroke: "freestyle" })]),
      ]),
  },
  {
    id: "w3",
    section: "warmup",
    name: { nl: "Opbouwend inzwemmen", en: "Build-up warm-up" },
    difficulty: 1,
    levels: allLevels,
    steps: (_pool, level) =>
      as("warmup", [
        swim(by(level, 100, 200, 200), 1, { stroke: "freestyle", rest: 10 }),
        repeat(by(level, 2, 4, 6), swim(50, 2, { stroke: "freestyle", rest: 15 })),
      ]),
  },
  {
    id: "w4",
    section: "warmup",
    name: { nl: "Rug en borst", en: "Back and breast" },
    difficulty: 1,
    levels: allLevels,
    steps: (pool, level) =>
      as("warmup", [
        swim(100, 1, { stroke: "freestyle", rest: 10 }),
        swim(by(level, 50, 100, 100), 1, { stroke: "backstroke", rest: 10 }),
        repeat(by(level, 2, 4, 8), swim(pool, 1, { stroke: "breaststroke", rest: 10 })),
      ]),
  },

  // Main 1: technique
  {
    id: "t1",
    section: "technique",
    name: { nl: "Watergevoel", en: "Feel for the water" },
    difficulty: 1,
    levels: allLevels,
    steps: (pool, level) => [
      drillSet(by(level, 2, 3, 4), "fist", pool),
      drillSet(by(level, 2, 3, 4), "spread_fingers", pool),
    ],
  },
  {
    id: "t2",
    section: "technique",
    name: { nl: "Timing", en: "Timing" },
    difficulty: 1,
    levels: allLevels,
    steps: (pool, level) => [
      drillSet(by(level, 2, 3, 4), "catch_up", pool, ["fins"]),
      drillSet(by(level, 2, 3, 4), "single_arm", pool, ["fins"]),
    ],
  },
  {
    id: "t3",
    section: "technique",
    name: { nl: "Wrikken", en: "Sculling" },
    difficulty: 1,
    levels: notBeginner,
    steps: (pool, level) => [
      drillSet(by(level, 2, 3, 4), "scull_front", pool, ["snorkel"]),
      drillSet(by(level, 2, 3, 4), "scull_mid", pool, ["snorkel"]),
    ],
  },
  {
    id: "t4",
    section: "technique",
    name: { nl: "Ligging en ademhaling", en: "Position and breathing" },
    difficulty: 1,
    levels: allLevels,
    steps: (pool, level) => [
      drillSet(by(level, 2, 3, 4), "side_kick", pool, ["fins"]),
      drillSet(by(level, 2, 3, 4), "kick", pool, ["fins"]),
    ],
  },
  {
    id: "t5",
    section: "technique",
    name: { nl: "Hoge elleboog", en: "High elbow" },
    difficulty: 1,
    levels: notBeginner,
    steps: (pool, level) => [
      drillSet(by(level, 2, 3, 4), "doggy_paddle", pool, ["fins", "snorkel"]),
      drillSet(by(level, 2, 3, 4), "fingertip_drag", pool, ["fins"]),
    ],
  },
  {
    id: "t6",
    section: "technique",
    name: { nl: "Rustige slag", en: "Smooth stroke" },
    difficulty: 1,
    levels: allLevels,
    steps: (pool, level) => [
      drillSet(by(level, 2, 3, 4), "catch_up", pool),
      drillSet(by(level, 2, 3, 4), "fingertip_drag", pool),
    ],
  },

  // Main 2: endurance
  {
    id: "m1",
    section: "main",
    name: { nl: "Rustige duur", en: "Steady endurance" },
    difficulty: 2,
    levels: allLevels,
    steps: (_pool, level) => [
      repeat(by(level, 3, 4, 5), swim(by(level, 100, 200, 300), 2, { stroke: "freestyle", rest: 20 })),
    ],
  },
  {
    id: "m2",
    section: "main",
    name: { nl: "Pull", en: "Pull" },
    difficulty: 2,
    levels: allLevels,
    steps: (_pool, level) => [
      repeat(by(level, 3, 3, 4), drill("pull", by(level, 100, 200, 300), { zone: 2, rest: 20, equipment: ["pull_buoy"] })),
    ],
  },
  {
    id: "m3",
    section: "main",
    name: { nl: "Ladder", en: "Ladder" },
    difficulty: 2,
    levels: allLevels,
    steps: (_pool, level) =>
      by(level, [50, 100, 150, 100, 50], [100, 200, 300, 200, 100], [100, 200, 300, 400, 300, 200, 100]).map(
        (meters) => swim(meters, 2, { stroke: "freestyle", rest: 20 }),
      ),
  },
  {
    id: "m4",
    section: "main",
    name: { nl: "Zwemmen en benen", en: "Swim and kick" },
    difficulty: 2,
    levels: allLevels,
    steps: (_pool, level) => [
      repeat(
        by(level, 2, 3, 4),
        swim(by(level, 100, 150, 200), 2, { stroke: "freestyle", rest: 10 }),
        drill("kick", by(level, 50, 50, 100), { rest: 20, equipment: ["fins"] }),
      ),
    ],
  },
  {
    id: "m5",
    section: "main",
    name: { nl: "Lange duur", en: "Long steady swim" },
    difficulty: 2,
    levels: allLevels,
    steps: (_pool, level) => [swim(by(level, 400, 800, 1200), 2, { stroke: "freestyle" })],
  },
  {
    id: "m6",
    section: "main",
    name: { nl: "Wisselslag duur", en: "Mixed strokes" },
    difficulty: 2,
    levels: allLevels,
    steps: (_pool, level) => [
      repeat(
        by(level, 2, 3, 4),
        swim(100, 2, { stroke: "freestyle", rest: 10 }),
        swim(50, 1, { stroke: "backstroke", rest: 10 }),
        swim(50, 1, { stroke: "breaststroke", rest: 15 }),
      ),
    ],
  },

  // Main 3: speed (hard)
  {
    id: "s1",
    section: "speed",
    name: { nl: "Tempo", en: "Tempo" },
    difficulty: 3,
    levels: allLevels,
    steps: (_pool, level) => [
      repeat(by(level, 4, 6, 8), swim(by(level, 50, 100, 100), 3, { stroke: "freestyle", rest: 30 })),
    ],
  },
  {
    id: "s2",
    section: "speed",
    name: { nl: "Opbouwend", en: "Build" },
    difficulty: 3,
    levels: allLevels,
    steps: (_pool, level) => [
      repeat(
        by(level, 2, 3, 4),
        swim(50, 2, { stroke: "freestyle", rest: 10 }),
        swim(50, 3, { stroke: "freestyle", rest: 10 }),
        swim(50, 4, { stroke: "freestyle", rest: 30 }),
      ),
    ],
  },
  {
    id: "s3",
    section: "speed",
    name: { nl: "Drempel", en: "Threshold" },
    difficulty: 4,
    levels: notBeginner,
    steps: (_pool, level) => [
      repeat(by(level, 3, 4, 5), swim(by(level, 100, 200, 200), 4, { stroke: "freestyle", rest: 30 })),
    ],
  },
  {
    id: "s4",
    section: "speed",
    name: { nl: "Kracht met peddels", en: "Paddle power" },
    difficulty: 4,
    levels: notBeginner,
    steps: (_pool, level) => [
      repeat(by(level, 4, 6, 8), swim(by(level, 50, 100, 100), 3, { stroke: "freestyle", rest: 30, equipment: ["paddles"] })),
    ],
  },
  {
    id: "s5",
    section: "speed",
    name: { nl: "Snelle benen", en: "Fast fins" },
    difficulty: 4,
    levels: notBeginner,
    steps: (_pool, level) => [
      repeat(by(level, 6, 6, 8), swim(50, 5, { stroke: "freestyle", rest: 30, equipment: ["fins"] })),
    ],
  },
  {
    id: "s6",
    section: "speed",
    name: { nl: "Sprints", en: "Sprints" },
    difficulty: 5,
    levels: ["advanced"],
    steps: (_pool, level) => [repeat(by(level, 6, 8, 10), swim(50, 5, { stroke: "freestyle", rest: 60 }))],
  },

  // Cool-down
  {
    id: "c1",
    section: "cooldown",
    name: { nl: "Uitzwemmen", en: "Cool-down" },
    difficulty: 1,
    levels: allLevels,
    steps: (_pool, level) => as("cooldown", [swim(by(level, 100, 100, 200), 1, { stroke: "freestyle" })]),
  },
  {
    id: "c2",
    section: "cooldown",
    name: { nl: "Rug en schoolslag", en: "Back and breast" },
    difficulty: 1,
    levels: allLevels,
    steps: () =>
      as("cooldown", [swim(50, 1, { stroke: "backstroke" }), swim(50, 1, { stroke: "breaststroke" })]),
  },
];

const blocksById = new Map(swimBlocks.map((block) => [block.id, block]));

export function getSwimBlock(id: string): SwimBlock | undefined {
  return blocksById.get(id);
}

export function blocksForSection(section: SwimSection): SwimBlock[] {
  return swimBlocks.filter((block) => block.section === section);
}
