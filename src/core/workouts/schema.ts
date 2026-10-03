import { z } from "zod";
import { drillIds, equipmentTypes, strokes } from "./swim";
import { workoutCategories } from "./types";

// Describes the JSON files in ./data exactly as they are written, so a typo or
// a missing field in a file is caught by the tests instead of in the app.

const zone = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const zoneTexts = z.object({ "1": z.string(), "2": z.string(), "3": z.string(), "4": z.string(), "5": z.string() });

type RawStep =
  | {
      type: "warmup" | "interval" | "cooldown";
      zone: 1 | 2 | 3 | 4 | 5;
      duration_min?: number;
      distance_km?: number;
      distance_m?: number;
      label?: string;
      label_en?: string;
      activity?: "walk";
      rest_sec?: number;
      stroke?: (typeof strokes)[number];
      drill?: (typeof drillIds)[number];
      equipment?: (typeof equipmentTypes)[number][];
    }
  | { type: "repeat"; repeat: number; steps: RawStep[] };

const rawStep: z.ZodType<RawStep> = z.lazy(() =>
  z.union([
    z
      .strictObject({
        type: z.enum(["warmup", "interval", "cooldown"]),
        zone,
        duration_min: z.number().positive().optional(),
        distance_km: z.number().positive().optional(),
        distance_m: z.number().int().positive().optional(),
        label: z.string().optional(),
        label_en: z.string().optional(),
        activity: z.literal("walk").optional(),
        rest_sec: z.number().int().positive().optional(),
        stroke: z.enum(strokes).optional(),
        drill: z.enum(drillIds).optional(),
        equipment: z.array(z.enum(equipmentTypes)).min(1).optional(),
      })
      // Every step has exactly one length: minutes, kilometers or meters.
      .refine(
        (step) =>
          [step.duration_min, step.distance_km, step.distance_m].filter((v) => v !== undefined)
            .length === 1,
        "A step needs exactly one of duration_min, distance_km or distance_m",
      )
      // A Dutch label needs an English one too.
      .refine((step) => (step.label === undefined) === (step.label_en === undefined), "label_en missing"),
    z.strictObject({
      type: z.literal("repeat"),
      repeat: z.number().int().min(2),
      steps: z.array(rawStep).min(1),
    }),
  ]),
);

const rawWorkout = z.strictObject({
  id: z.string().regex(/^(run|bike|swim)_[a-z0-9_]+$/),
  name: z.string().min(1),
  name_en: z.string().min(1),
  sport: z.enum(["run", "bike", "swim"]),
  category: z.enum(workoutCategories),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  target: z.enum(["time", "distance"]),
  total_minutes: z.number().positive().optional(),
  run_distance_km: z.number().positive().optional(),
  ride_distance_km: z.number().positive().optional(),
  total_distance_m: z.number().int().positive().optional(),
  description: z.string().min(1),
  description_en: z.string().min(1),
  steps: z.array(rawStep).min(1),
});

export const rawWorkoutFileSchema = z.object({
  version: z.number().int(),
  zones: zoneTexts,
  zones_en: zoneTexts,
  warmup_cooldown: z.string().optional(),
  note: z.string().optional(),
  workouts: z.array(rawWorkout).min(1),
});

export type RawWorkoutFile = z.infer<typeof rawWorkoutFileSchema>;
export type RawWorkout = z.infer<typeof rawWorkout>;
export type { RawStep };
