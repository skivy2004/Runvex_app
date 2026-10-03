import { describe, expect, it } from "vitest";
import cyclingFile from "./data/cycling.json";
import { getWorkout, workoutLibrary, workoutsForSport, zoneDescription } from "./library";
import { rawWorkoutFileSchema } from "./schema";
import { drillIds, equipmentNames, strokeNames, swimDrills, usedEquipment, type Equipment } from "./swim";
import type { WorkoutStep } from "./types";

describe("workout file schema", () => {
  const firstWorkout = cyclingFile.workouts[0];
  const withWorkout = (workout: object) => ({ ...cyclingFile, workouts: [workout] });

  it("accepts the real files", () => {
    expect(rawWorkoutFileSchema.safeParse(cyclingFile).success).toBe(true);
  });

  it("rejects common mistakes", () => {
    const mistakes = [
      { ...firstWorkout, name_en: undefined }, // missing translation
      { ...firstWorkout, sport: "ride" }, // unknown sport
      { ...firstWorkout, difficulty: 6 }, // difficulty out of range
      { ...firstWorkout, steps: [{ type: "interval", zone: 2 }] }, // step without length
      { ...firstWorkout, steps: [{ type: "interval", zone: 2, duration_min: 5, distance_km: 2 }] }, // two lengths
      { ...firstWorkout, steps: [{ type: "interval", zone: 6, duration_min: 5 }] }, // zone 6
      { ...firstWorkout, steps: [{ type: "interval", zone: 1, distance_m: 25, drill: "flying" }] }, // unknown drill
      { ...firstWorkout, steps: [{ type: "interval", zone: 1, distance_m: 25, equipment: ["flippers"] }] }, // unknown equipment
      { ...firstWorkout, steps: [{ type: "interval", zone: 1, distance_m: 25, equipment: [] }] }, // empty equipment list
    ];
    for (const workout of mistakes) {
      expect(rawWorkoutFileSchema.safeParse(withWorkout(workout)).success).toBe(false);
    }
  });
});

/** Adds up a field over all steps, counting repeats as many times as they repeat. */
function sumSteps(steps: WorkoutStep[], field: "durationMinutes" | "distanceMeters"): number {
  return steps.reduce(
    (total, step) =>
      total + (step.type === "repeat" ? step.times * sumSteps(step.steps, field) : (step[field] ?? 0)),
    0,
  );
}

describe("workout library", () => {
  it("loads all workouts from the three files", () => {
    expect(workoutsForSport("running")).toHaveLength(55);
    expect(workoutsForSport("cycling")).toHaveLength(61);
    expect(workoutsForSport("swimming")).toHaveLength(38);
  });

  it("has unique ids", () => {
    const ids = workoutLibrary.map((workout) => workout.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has a Dutch and English name and description for every workout", () => {
    for (const workout of workoutLibrary) {
      expect(workout.name.nl && workout.name.en, workout.id).toBeTruthy();
      expect(workout.description.nl && workout.description.en, workout.id).toBeTruthy();
    }
  });

  it("matches the total time of time workouts with their steps", () => {
    for (const workout of workoutLibrary.filter((item) => item.target === "time")) {
      expect(workout.durationMinutes, workout.id).not.toBeNull();
      expect(sumSteps(workout.steps, "durationMinutes"), workout.id).toBe(workout.durationMinutes);
      expect(sumSteps(workout.steps, "distanceMeters"), workout.id).toBe(0);
    }
  });

  it("matches the total distance of distance workouts with their steps", () => {
    for (const workout of workoutLibrary.filter((item) => item.target === "distance")) {
      expect(workout.distanceMeters, workout.id).not.toBeNull();
      expect(sumSteps(workout.steps, "distanceMeters"), workout.id).toBe(workout.distanceMeters);
    }
  });

  it("only has distance workouts for swimming", () => {
    expect(workoutsForSport("swimming").every((workout) => workout.target === "distance")).toBe(true);
  });

  it("finds workouts by id and describes zones in both languages", () => {
    expect(getWorkout("bike_60min_1_easy")?.name).toEqual({ nl: "1u Easy Ride", en: "1h Easy Ride" });
    expect(getWorkout("does_not_exist")).toBeUndefined();
    expect(zoneDescription("cycling", 4, "nl")).toContain("Drempel");
    expect(zoneDescription("cycling", 4, "en")).toContain("Threshold");
  });
});

describe("swim drills and equipment", () => {
  it("accepts a drill step with a stroke and equipment", () => {
    const drillStep = {
      type: "interval",
      zone: 1,
      distance_m: 25,
      stroke: "freestyle",
      drill: "fist",
      equipment: ["fins", "snorkel"],
    };
    const file = { ...cyclingFile, workouts: [{ ...cyclingFile.workouts[0], steps: [drillStep] }] };
    expect(rawWorkoutFileSchema.safeParse(file).success).toBe(true);
  });

  it("has a Dutch and English name and how-to for every drill", () => {
    for (const id of drillIds) {
      const drill = swimDrills[id];
      expect(drill.name.nl && drill.name.en && drill.howTo.nl && drill.howTo.en, id).toBeTruthy();
    }
    for (const names of [...Object.values(equipmentNames), ...Object.values(strokeNames).map((s) => s.name)]) {
      expect(names.nl && names.en).toBeTruthy();
    }
  });

  it("lists the equipment of all steps once, in a fixed order", () => {
    const step = (equipment: Equipment[]): WorkoutStep => ({
      type: "interval",
      zone: 1,
      durationMinutes: null,
      distanceMeters: 50,
      label: null,
      isWalking: false,
      restSeconds: null,
      stroke: null,
      drill: null,
      equipment,
    });
    const steps: WorkoutStep[] = [
      step(["snorkel"]),
      { type: "repeat", times: 4, steps: [step(["fins", "snorkel"]), step([])] },
    ];
    expect(usedEquipment(steps)).toEqual(["fins", "snorkel"]);
    expect(usedEquipment([step([])])).toEqual([]);
  });
});
