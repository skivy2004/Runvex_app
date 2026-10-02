import type { ExperienceLevel } from "@/core/training";
import type { Workout, WorkoutStep } from "./types";

/** Estimated swim pace per level, in seconds per 100 m (rests not included). */
export const swimPaceSecondsPer100: Record<ExperienceLevel, number> = {
  beginner: 150,
  intermediate: 130,
  advanced: 110,
};

/** All rest in a workout, in seconds, counting repeats as many times as they repeat. */
function restSeconds(steps: WorkoutStep[]): number {
  return steps.reduce(
    (total, step) =>
      total + (step.type === "repeat" ? step.times * restSeconds(step.steps) : (step.restSeconds ?? 0)),
    0,
  );
}

/**
 * How many minutes a workout takes. Time workouts have a fixed duration. Swims are
 * estimated from the distance and the pace for this level, rounded up to 5 minutes.
 * Run and ride distance workouts depend too much on the athlete, so they return null.
 */
export function estimatedMinutes(workout: Workout, level: ExperienceLevel): number | null {
  if (workout.durationMinutes !== null) return workout.durationMinutes;
  if (workout.sport !== "swimming" || workout.distanceMeters === null) return null;
  const seconds =
    (workout.distanceMeters / 100) * swimPaceSecondsPer100[level] + restSeconds(workout.steps);
  return Math.ceil(seconds / 60 / 5) * 5;
}
