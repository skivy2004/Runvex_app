import type { Locale } from "@/core/locale";
import type { Sport } from "@/core/training";
import cyclingFile from "./data/cycling.json";
import runningFile from "./data/running.json";
import swimmingFile from "./data/swimming.json";
import { rawWorkoutFileSchema, type RawStep, type RawWorkout } from "./schema";
import { getSwimWorkout } from "./swimTraining";
import type { LocalizedText, Workout, WorkoutStep, Zone } from "./types";

// The workout library, built from the JSON files in ./data.
// Those files keep the original format; this file turns them into one shape.

const sportNames: Record<RawWorkout["sport"], Sport> = {
  run: "running",
  bike: "cycling",
  swim: "swimming",
};

function toStep(raw: RawStep): WorkoutStep {
  if (raw.type === "repeat") {
    return { type: "repeat", times: raw.repeat, steps: raw.steps.map(toStep) };
  }
  const distanceMeters =
    raw.distance_m ?? (raw.distance_km !== undefined ? Math.round(raw.distance_km * 1000) : null);
  return {
    type: raw.type,
    zone: raw.zone,
    durationMinutes: raw.duration_min ?? null,
    distanceMeters,
    label: raw.label ? { nl: raw.label, en: raw.label_en ?? raw.label } : null,
    isWalking: raw.activity === "walk",
    restSeconds: raw.rest_sec ?? null,
    stroke: raw.stroke ?? null,
    drill: raw.drill ?? null,
    equipment: raw.equipment ?? [],
  };
}

function toWorkout(raw: RawWorkout): Workout {
  const distanceKm = raw.run_distance_km ?? raw.ride_distance_km;
  return {
    id: raw.id,
    sport: sportNames[raw.sport],
    category: raw.category,
    difficulty: raw.difficulty,
    name: { nl: raw.name, en: raw.name_en },
    description: { nl: raw.description, en: raw.description_en },
    target: raw.target,
    durationMinutes: raw.total_minutes ?? null,
    distanceMeters:
      raw.total_distance_m ?? (distanceKm !== undefined ? Math.round(distanceKm * 1000) : null),
    steps: raw.steps.map(toStep),
  };
}

// Parsing checks every file against the schema. A broken file fails loudly here
// (and in the tests) instead of showing strange workouts in the app.
const files = {
  running: rawWorkoutFileSchema.parse(runningFile),
  cycling: rawWorkoutFileSchema.parse(cyclingFile),
  swimming: rawWorkoutFileSchema.parse(swimmingFile),
} as const;

export const workoutLibrary: Workout[] = Object.values(files).flatMap((file) =>
  file.workouts.map(toWorkout),
);

const byId = new Map(workoutLibrary.map((workout) => [workout.id, workout]));

/** A workout from the files, or a swim training built from blocks (see swimTraining.ts). */
export function getWorkout(id: string): Workout | undefined {
  return byId.get(id) ?? getSwimWorkout(id) ?? undefined;
}

export function workoutsForSport(sport: Sport): Workout[] {
  return workoutLibrary.filter((workout) => workout.sport === sport);
}

type LibrarySport = keyof typeof files;

/** What each zone means for this sport, e.g. zone 2 = "Endurance, 60-70% ...". */
export function zoneDescription(sport: LibrarySport, zone: Zone, locale: Locale): string {
  const file = files[sport];
  return (locale === "en" ? file.zones_en : file.zones)[zone];
}

export function localized(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

/** All zones used in these steps, lowest first. */
export function usedZones(steps: WorkoutStep[]): Zone[] {
  const zones = new Set<Zone>();
  const collect = (list: WorkoutStep[]) => {
    for (const step of list) {
      if (step.type === "repeat") collect(step.steps);
      else zones.add(step.zone);
    }
  };
  collect(steps);
  return [...zones].sort();
}

/** The zones of a workout with what they mean, e.g. [{ zone: 2, text: "Easy, 60-70%" }]. */
export function zoneLegend(workout: Workout, locale: Locale): { zone: Zone; text: string }[] {
  if (workout.sport === "strength") return [];
  const sport = workout.sport;
  return usedZones(workout.steps).map((zone) => ({ zone, text: zoneDescription(sport, zone, locale) }));
}

