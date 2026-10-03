import type { Locale } from "@/core/locale";
import type { ExperienceLevel, Sport } from "@/core/training";
import type { DrillId, Equipment, PoolLength, Stroke } from "./swim";
import type { SwimSection } from "./swimBlocks";

/** A text in every app language. */
export type LocalizedText = Record<Locale, string>;

/** Heart rate / power zone: 1 = very easy ... 5 = maximal. */
export type Zone = 1 | 2 | 3 | 4 | 5;

export const workoutCategories = [
  "easy",
  "endurance",
  "fartlek",
  "progressive",
  "tempo",
  "threshold",
  "vo2max",
  "mixed",
] as const;
export type WorkoutCategory = (typeof workoutCategories)[number];

/** One part of a workout. A "repeat" step repeats its own steps a number of times. */
export type WorkoutStep =
  | {
      type: "warmup" | "interval" | "cooldown";
      zone: Zone;
      /** Exactly one of these two is set. */
      durationMinutes: number | null;
      distanceMeters: number | null;
      /** e.g. "surge" / "versnelling" */
      label: LocalizedText | null;
      /** Walking instead of running, e.g. during a warm-up. */
      isWalking: boolean;
      /** Rest after this step (swimming). */
      restSeconds: number | null;
      /** Swimming: the stroke; null = freestyle. */
      stroke: Stroke | null;
      /** Swimming: a technique drill instead of normal swimming. */
      drill: DrillId | null;
      /** Swimming: what to use during this step, e.g. fins. */
      equipment: Equipment[];
    }
  | {
      type: "repeat";
      times: number;
      steps: WorkoutStep[];
    };

/** A workout from the library, the same shape for every sport. */
export type Workout = {
  id: string;
  sport: Sport;
  category: WorkoutCategory;
  /** 1 = easiest ... 5 = hardest */
  difficulty: 1 | 2 | 3 | 4 | 5;
  name: LocalizedText;
  description: LocalizedText;
  /** "time" workouts have a fixed duration; "distance" workouts a fixed distance. */
  target: "time" | "distance";
  durationMinutes: number | null;
  distanceMeters: number | null;
  steps: WorkoutStep[];
  /** Swim trainings built from blocks: the pool, the level and the blocks in order. */
  swim?: SwimInfo;
};

export type SwimInfo = {
  poolLength: PoolLength;
  level: ExperienceLevel;
  sections: { section: SwimSection; blockId: string; name: LocalizedText; steps: WorkoutStep[] }[];
};
