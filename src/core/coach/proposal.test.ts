import { describe, expect, it } from "vitest";
import { getWorkout } from "@/core/workouts/library";
import { adjustOptions, checkChanges, moveDates, swapDirection, type ChangeableTraining } from "./proposal";

const swim = { poolLength: 25 as const, equipment: [] };

describe("adjustOptions", () => {
  it("offers easier, similar and harder runs that fit the day", () => {
    const tempo = getWorkout("run_45_3_tempo")!;
    const options = adjustOptions(tempo, "intermediate", 60, swim);
    const difficulty = (option: string) => getWorkout(option.split(":")[0])!.difficulty;
    expect(options.easier.length).toBeGreaterThan(0);
    expect(options.easier.every((option) => difficulty(option) < 3)).toBe(true);
    expect(options.harder.every((option) => difficulty(option) > 3)).toBe(true);
    expect(options.similar.every((option) => difficulty(option) === 3)).toBe(true);
    expect([...options.easier, ...options.similar, ...options.harder].every((option) => Number(option.split(":")[1]) <= 60)).toBe(true);
  });

  it("changes a swim one block at a time, e.g. adding a speed block makes it harder", () => {
    const easySwim = getWorkout("swim_25_i_w1_t1_m1_s0_c1")!;
    const options = adjustOptions(easySwim, "intermediate", 60, swim);
    expect(options.harder.length).toBeGreaterThan(0);
    expect(options.harder.every((option) => option.startsWith("swim_25_i_w1_t1_m1_s"))).toBe(true);
  });
});

describe("checkChanges", () => {
  const today = "2026-10-05";
  const trainings: ChangeableTraining[] = [
    { id: "a", date: "2026-10-06", sport: "running", options: { easier: ["run_30_1_easy:30"], similar: [], harder: ["run_45_4_threshold:45"] } },
    { id: "b", date: "2026-10-08", sport: "cycling", options: { easier: [], similar: [], harder: [] } },
  ];

  it("keeps changes to our options and drops everything else", () => {
    const valid = checkChanges(
      [
        { type: "swap", workoutId: "a", newWorkoutId: "run_30_1_easy", newDate: null, reason: " Rustiger. " },
        { type: "swap", workoutId: "a", newWorkoutId: "run_45_4_threshold", newDate: null, reason: "twice" }, // a again
        { type: "swap", workoutId: "b", newWorkoutId: "bike_made_up", newDate: null, reason: "x" }, // not offered
        { type: "move", workoutId: "b", newDate: "2026-12-01", newWorkoutId: null, reason: "x" }, // too far
        { type: "remove", workoutId: "someone-else", newWorkoutId: null, newDate: null, reason: "x" }, // not listed
      ],
      trainings,
      today,
    );
    expect(valid).toEqual([{ type: "swap", workoutId: "a", newWorkoutId: "run_30_1_easy", newDate: null, reason: "Rustiger." }]);
  });

  it("allows moving within two weeks and removing", () => {
    expect(moveDates(today)).toHaveLength(14);
    const valid = checkChanges(
      [
        { type: "move", workoutId: "b", newDate: "2026-10-09", newWorkoutId: null, reason: "x" },
        { type: "remove", workoutId: "a", newWorkoutId: null, newDate: null, reason: "x" },
      ],
      trainings,
      today,
    );
    expect(valid).toHaveLength(2);
  });
});

describe("swapDirection", () => {
  it("compares difficulty", () => {
    expect(swapDirection("run_45_3_tempo", "run_30_1_easy")).toBe("easier");
    expect(swapDirection("run_45_3_tempo", "run_45_4_threshold")).toBe("harder");
  });
});
