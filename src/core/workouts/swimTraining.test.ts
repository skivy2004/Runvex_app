import { describe, expect, it } from "vitest";
import { fittingWorkouts, planWeek, workoutAlternatives } from "@/core/planner";
import type { ExperienceLevel } from "@/core/training";
import { getWorkout } from "./library";
import { equipmentTypes, poolLengths, usedEquipment } from "./swim";
import { swimBlocks, swimSections } from "./swimBlocks";
import {
  composeSwimWorkout,
  parseSwimWorkoutId,
  swimWorkoutId,
  swimSuggestions,
  swimWorkoutInPool,
  swimWorkouts,
} from "./swimTraining";
import type { WorkoutStep } from "./types";

const levels: ExperienceLevel[] = ["beginner", "intermediate", "advanced"];

function singleSteps(steps: WorkoutStep[]): Exclude<WorkoutStep, { type: "repeat" }>[] {
  return steps.flatMap((step) => (step.type === "repeat" ? singleSteps(step.steps) : [step]));
}

describe("swim blocks", () => {
  it("has 4 warm-ups, 6 technique, 6 endurance, 6 speed and 2 cool-down blocks with unique ids", () => {
    const count = (section: string) => swimBlocks.filter((block) => block.section === section).length;
    expect(swimSections.map(count)).toEqual([4, 6, 6, 6, 2]);
    expect(new Set(swimBlocks.map((block) => block.id)).size).toBe(swimBlocks.length);
  });

  it("only uses whole pool lengths, so you never switch halfway", () => {
    for (const block of swimBlocks) {
      for (const level of block.levels) {
        for (const pool of poolLengths) {
          for (const step of singleSteps(block.steps(pool, level))) {
            expect(step.distanceMeters! % pool, `${block.id} ${level} ${pool}`).toBe(0);
            expect(step.distanceMeters, `${block.id} ${level} ${pool}`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("makes only speed blocks hard", () => {
    for (const block of swimBlocks) {
      expect(block.difficulty >= 3, block.id).toBe(block.section === "speed");
    }
  });

  it("has a Dutch and English name for every block", () => {
    for (const block of swimBlocks) expect(block.name.nl && block.name.en, block.id).toBeTruthy();
  });
});

describe("swim training ids", () => {
  const composition = {
    poolLength: 25 as const,
    level: "intermediate" as const,
    warmup: "w2",
    technique: "t4",
    main: "m1",
    speed: "s3",
    cooldown: "c1",
  };

  it("writes and reads the blocks of a training", () => {
    const id = swimWorkoutId(composition);
    expect(id).toBe("swim_25_i_w2_t4_m1_s3_c1");
    expect(parseSwimWorkoutId(id)).toEqual(composition);
    expect(parseSwimWorkoutId("swim_25_i_w2_t4_m1_s0_c1")?.speed).toBeNull();
  });

  it("fits the database column for template ids", () => {
    const id = swimWorkoutId({ ...composition, poolLength: 50, level: "advanced" });
    expect(id).toMatch(/^(run|bike|swim)_[a-z0-9_]+$/);
    expect(id.length).toBeLessThanOrEqual(64);
  });

  it("rejects ids with unknown blocks, blocks in the wrong place or not for the level", () => {
    expect(parseSwimWorkoutId("swim_25_i_w9_t4_m1_s3_c1")).toBeNull(); // no warm-up 9
    expect(parseSwimWorkoutId("swim_25_i_t4_w2_m1_s3_c1")).toBeNull(); // wrong order
    expect(parseSwimWorkoutId("swim_33_i_w2_t4_m1_s3_c1")).toBeNull(); // no 33 m pool
    expect(parseSwimWorkoutId("swim_25_b_w2_t3_m1_s0_c1")).toBeNull(); // sculling isn't for beginners
    expect(parseSwimWorkoutId("swim_1500m_2_endurance")).toBeNull(); // an old library swim
  });

  it("builds the training with its sections, total distance and difficulty", () => {
    const workout = composeSwimWorkout(composition)!;
    expect(workout.swim?.sections.map((section) => section.section)).toEqual(swimSections);
    expect(workout.difficulty).toBe(4);
    expect(workout.name.nl).toBe("Ligging en ademhaling · Rustige duur · Drempel");
    const total = singleSteps(workout.steps).length;
    expect(total).toBeGreaterThan(0);
    expect(getWorkout(workout.id)?.distanceMeters).toBe(workout.distanceMeters);
  });

  it("swims longer drills in a 50 m pool", () => {
    const short = composeSwimWorkout(composition)!;
    const long = getWorkout(swimWorkoutInPool(short.id, 50)!)!;
    expect(long.swim?.poolLength).toBe(50);
    expect(long.distanceMeters!).toBeGreaterThan(short.distanceMeters!);
  });
});

describe("swimWorkouts", () => {
  it("only gives trainings you have the equipment for", () => {
    for (const level of levels) {
      const withoutGear = swimWorkouts(level, 25, []);
      expect(withoutGear.length).toBeGreaterThan(0);
      expect(withoutGear.every((workout) => usedEquipment(workout.steps).length === 0)).toBe(true);
      const onlyFins = swimWorkouts(level, 25, ["fins"]);
      expect(onlyFins.every((workout) => usedEquipment(workout.steps).every((item) => item === "fins"))).toBe(true);
    }
    // With everything you get more choice.
    expect(swimWorkouts("advanced", 25, [...equipmentTypes]).length).toBeGreaterThan(
      swimWorkouts("advanced", 25, []).length,
    );
  });

  it("has easy and hard trainings that fit a session for every level, pool and without gear", () => {
    for (const level of levels) {
      for (const pool of poolLengths) {
        const swim = { poolLength: pool, equipment: [] };
        expect(fittingWorkouts("swimming", level, 600, "easy", swim).length, `${level} ${pool}`).toBeGreaterThan(0);
        expect(fittingWorkouts("swimming", level, 600, "hard", swim).length, `${level} ${pool}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("swim alternatives", () => {
  it("changes one block and keeps the pool", () => {
    const current = getWorkout("swim_50_i_w1_t1_m1_s0_c1")!;
    const swim = { poolLength: 25 as const, equipment: [...equipmentTypes] };
    const alternatives = workoutAlternatives(current, "intermediate", 60, false, swim);
    expect(alternatives.length).toBeGreaterThan(0);
    for (const { workout } of alternatives) {
      const other = parseSwimWorkoutId(workout.id)!;
      expect(other.poolLength).toBe(50);
      const changed = [other.technique !== "t1", other.main !== "m1", other.speed !== null];
      expect(changed.filter(Boolean)).toHaveLength(1);
    }
  });
});

describe("planning a swim week", () => {
  it("builds block swims for your pool with a different technique each time", () => {
    const swimDay = { minutes: 60, sports: ["swimming" as const], longSessions: [] };
    const restDay = { minutes: 0, sports: [], longSessions: [] };
    const plan = planWeek({
      weekStart: "2026-10-05",
      today: "2026-10-01",
      availability: [swimDay, restDay, swimDay, restDay, swimDay, restDay, restDay],
      sports: [{ sport: "swimming", level: "intermediate" }],
      existing: [],
      recentTemplateIds: [],
      goal: null,
      swim: { poolLength: 50, equipment: ["fins", "snorkel"] },
    });
    expect(plan).toHaveLength(3);
    const compositions = plan.map((session) => parseSwimWorkoutId(session.templateId)!);
    expect(compositions.every((item) => item.poolLength === 50)).toBe(true);
    expect(new Set(compositions.map((item) => item.technique)).size).toBe(3);
  });

  it("uses the equipment you own", () => {
    const swimDay = { minutes: 60, sports: ["swimming" as const], longSessions: [] };
    const restDay = { minutes: 0, sports: [], longSessions: [] };
    const plan = planWeek({
      weekStart: "2026-10-05",
      today: "2026-10-01",
      availability: [swimDay, restDay, swimDay, restDay, swimDay, restDay, restDay],
      sports: [{ sport: "swimming", level: "intermediate" }],
      existing: [],
      recentTemplateIds: [],
      goal: null,
      swim: { poolLength: 25, equipment: [...equipmentTypes] },
    });
    for (const session of plan) {
      expect(usedEquipment(getWorkout(session.templateId)!.steps).length, session.templateId).toBeGreaterThan(0);
    }
  });
});

describe("swimSuggestions", () => {
  it("offers one swim per endurance block and speed choice, with varied technique", () => {
    const suggestions = swimSuggestions("intermediate", 25, []);
    const compositions = suggestions.map((workout) => parseSwimWorkoutId(workout.id)!);
    const keys = compositions.map((item) => `${item.main}|${item.speed}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(compositions.map((item) => item.technique)).size).toBeGreaterThan(1);
    expect(suggestions.every((workout) => usedEquipment(workout.steps).length === 0)).toBe(true);
  });
});
