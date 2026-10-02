import { describe, expect, it } from "vitest";
import { emptyDay, type DayAvailability } from "./availability";
import { addDays, daysBetween } from "./dates";
import {
  checkPlan,
  HARD_DIFFICULTY,
  MAX_HARD_PER_WEEK,
  pickWorkout,
  planningContext,
  planWeek,
  type PlannerInput,
} from "./planner";
import { estimatedMinutes } from "./workouts/estimate";
import { getWorkout } from "./workouts/library";

const MONDAY = "2026-10-05";

/** A week from [minutes, sports, longSessions] per day, Monday first. */
function week(...days: [number, DayAvailability["sports"]?, DayAvailability["longSessions"]?][]) {
  return days.map(([minutes, sports = [], longSessions = []]) =>
    minutes === 0 ? emptyDay() : { minutes, sports, longSessions },
  );
}

const triathlete: PlannerInput = {
  weekStart: MONDAY,
  today: "2026-10-01",
  availability: week(
    [60],
    [90, ["swimming"]],
    [60],
    [0],
    [45],
    [180, [], ["cycling"]],
    [90, ["running"], ["running"]],
  ),
  sports: [
    { sport: "running", level: "intermediate" },
    { sport: "cycling", level: "intermediate" },
    { sport: "swimming", level: "intermediate" },
  ],
  existing: [],
  recentTemplateIds: [],
  goal: null,
};

const dayIndex = (date: string) => daysBetween(MONDAY, date);
const isHard = (templateId: string) => getWorkout(templateId)!.difficulty >= HARD_DIFFICULTY;

describe("planWeek", () => {
  const plan = planWeek(triathlete);

  it("plans one session on every open training day and none on rest days", () => {
    expect(plan.map((session) => dayIndex(session.scheduledOn))).toEqual([0, 1, 2, 4, 5, 6]);
  });

  it("fits every session in the available time", () => {
    for (const session of plan) {
      expect(session.durationMinutes).toBeLessThanOrEqual(triathlete.availability[dayIndex(session.scheduledOn)].minutes);
    }
  });

  it("follows the sports chosen per day and puts long sessions on their day", () => {
    expect(plan[1].sport).toBe("swimming");
    expect(plan[4]).toMatchObject({ sport: "cycling", durationMinutes: 180 });
    expect(plan[5]).toMatchObject({ sport: "running", durationMinutes: 90 });
    expect(isHard(plan[4].templateId) || isHard(plan[5].templateId)).toBe(false);
  });

  it("balances the sports on flexible days", () => {
    const sports = new Set(plan.map((session) => session.sport));
    expect(sports).toEqual(new Set(["running", "cycling", "swimming"]));
  });

  it("plans about 20% hard sessions, at most 2, never on two days in a row", () => {
    const hardDays = plan.filter((session) => isHard(session.templateId)).map((s) => dayIndex(s.scheduledOn));
    expect(hardDays).toHaveLength(2);
    expect(hardDays[1] - hardDays[0]).toBeGreaterThan(1);
  });

  it("spreads the hard sessions over different sports", () => {
    const hardSports = plan.filter((session) => isHard(session.templateId)).map((s) => s.sport);
    expect(new Set(hardSports).size).toBe(2);
  });

  it("never uses the same workout twice in a week", () => {
    const ids = plan.map((session) => session.templateId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps hard sessions within the level", () => {
    const beginner = planWeek({
      ...triathlete,
      sports: triathlete.sports.map((item) => ({ ...item, level: "beginner" as const })),
    });
    for (const session of beginner) {
      expect(getWorkout(session.templateId)!.difficulty).toBeLessThanOrEqual(3);
    }
  });

  it("only plans a few hard sessions in a short week", () => {
    const runner: PlannerInput = {
      ...triathlete,
      availability: week([45], [0], [0], [0], [0], [0], [60, [], ["running"]]),
      sports: [{ sport: "running", level: "advanced" }],
    };
    const short = planWeek(runner);
    expect(short).toHaveLength(2);
    expect(short.some((session) => isHard(session.templateId))).toBe(false);
  });

  it("skips past days and days that already have a workout", () => {
    const midweek = planWeek({
      ...triathlete,
      today: addDays(MONDAY, 2),
      existing: [{ scheduledOn: addDays(MONDAY, 4), sport: "running", templateId: null }],
    });
    expect(midweek.map((session) => dayIndex(session.scheduledOn))).toEqual([2, 5, 6]);
  });

  it("counts an existing hard workout towards the limit and the no-two-in-a-row rule", () => {
    const withTempo = planWeek({
      ...triathlete,
      existing: [{ scheduledOn: MONDAY, sport: "running", templateId: "run_60_3_tempo" }],
    });
    const hardDays = withTempo.filter((s) => isHard(s.templateId)).map((s) => dayIndex(s.scheduledOn));
    expect(hardDays).toHaveLength(1);
    expect(hardDays).not.toContain(1);
  });

  it("tries another sport when the first one doesn't fit", () => {
    // Cycling workouts start at 60 minutes, so a 30-minute flexible day becomes a run.
    const plan30 = planWeek({
      ...triathlete,
      availability: week([30], [0], [0], [0], [0], [120, [], ["cycling"]], [60, [], ["running"]]),
      sports: [
        { sport: "cycling", level: "intermediate" },
        { sport: "running", level: "intermediate" },
      ],
    });
    expect(plan30[0]).toMatchObject({ scheduledOn: MONDAY, sport: "running" });
  });

  it("skips days with only strength training", () => {
    const strength = planWeek({
      ...triathlete,
      availability: week([60, ["strength"]], [0], [0], [0], [0], [0], [60, ["running"], ["running"]]),
      sports: [
        { sport: "running", level: "beginner" },
        { sport: "strength", level: "beginner" },
      ],
    });
    expect(strength.map((session) => dayIndex(session.scheduledOn))).toEqual([6]);
  });

  it("chooses other workouts than last week when it can", () => {
    const nextWeek = planWeek({ ...triathlete, recentTemplateIds: plan.map((s) => s.templateId) });
    // Swimming has only two easy workouts of this length (both already used last week),
    // so only runs and rides can all be new.
    const overlap = nextWeek.filter(
      (session) => session.sport !== "swimming" && plan.some((s) => s.templateId === session.templateId),
    );
    expect(overlap).toHaveLength(0);
  });

  it("tapers in race week: nothing from race day on, nothing hard just before", () => {
    const raceWeek = planWeek({
      ...triathlete,
      goal: { sports: ["running"], eventDate: addDays(MONDAY, 5) },
    });
    const days = raceWeek.map((session) => dayIndex(session.scheduledOn));
    expect(days).toEqual([0, 1, 2, 4]);
    expect(raceWeek.filter((s) => isHard(s.templateId)).map((s) => dayIndex(s.scheduledOn))).not.toContain(4);
    expect(raceWeek.filter((s) => isHard(s.templateId)).map((s) => dayIndex(s.scheduledOn))).not.toContain(3);
  });

  it("ignores a race in another week", () => {
    const later = planWeek({ ...triathlete, goal: { sports: ["running"], eventDate: addDays(MONDAY, 30) } });
    expect(later).toHaveLength(6);
  });

  it(`never plans more than ${MAX_HARD_PER_WEEK} hard sessions`, () => {
    const everyDay = planWeek({
      ...triathlete,
      availability: week([60], [60], [60], [60], [60], [60], [90, [], ["running"]]),
      sports: [{ sport: "running", level: "advanced" }],
    });
    expect(everyDay).toHaveLength(7);
    expect(everyDay.filter((s) => isHard(s.templateId))).toHaveLength(MAX_HARD_PER_WEEK);
  });
});

describe("checkPlan", () => {
  const context = planningContext(triathlete);
  const plan = planWeek(triathlete);

  it("accepts the rule-based plan", () => {
    expect(checkPlan(context, plan)).toEqual([]);
  });

  it("accepts the rule-based plan in every situation from the tests above", () => {
    const variants: PlannerInput[] = [
      { ...triathlete, today: addDays(MONDAY, 2) },
      { ...triathlete, goal: { sports: ["running"], eventDate: addDays(MONDAY, 5) } },
      { ...triathlete, existing: [{ scheduledOn: MONDAY, sport: "running", templateId: "run_60_3_tempo" }] },
      { ...triathlete, sports: triathlete.sports.map((item) => ({ ...item, level: "beginner" as const })) },
    ];
    for (const input of variants) {
      expect(checkPlan(planningContext(input), planWeek(input))).toEqual([]);
    }
  });

  it("rejects a session on a rest day or a taken day", () => {
    const restDay = { ...plan[0], scheduledOn: addDays(MONDAY, 3) };
    expect(checkPlan(context, [restDay])).toHaveLength(1);
  });

  it("rejects a workout that doesn't exist or doesn't fit", () => {
    expect(checkPlan(context, [{ ...plan[0], templateId: "run_made_up" }])).toHaveLength(1);
    // Friday has 45 minutes: a 90-minute run doesn't fit.
    const tooLong = { scheduledOn: addDays(MONDAY, 4), sport: "running" as const, templateId: "run_90_1_easy", durationMinutes: 90 };
    expect(checkPlan(context, [tooLong])).toHaveLength(1);
  });

  it("rejects a wrong duration", () => {
    expect(checkPlan(context, [{ ...plan[0], durationMinutes: 5 }])).toHaveLength(1);
  });

  it("rejects a hard session on a long session day", () => {
    const hardLong = { scheduledOn: addDays(MONDAY, 6), sport: "running" as const, templateId: "run_90_4_threshold", durationMinutes: 90 };
    expect(checkPlan(context, [hardLong])).toHaveLength(1);
  });

  it("rejects two hard days in a row and too many hard days", () => {
    const monday = { scheduledOn: MONDAY, sport: "running" as const, templateId: "run_60_4_threshold", durationMinutes: 60 };
    const tuesday = { scheduledOn: addDays(MONDAY, 1), sport: "swimming" as const, templateId: "swim_1000m_4_threshold", durationMinutes: 25 };
    const wednesday = { scheduledOn: addDays(MONDAY, 2), sport: "cycling" as const, templateId: "bike_60min_4_threshold", durationMinutes: 60 };
    const friday = { scheduledOn: addDays(MONDAY, 4), sport: "running" as const, templateId: "run_45_3_tempo", durationMinutes: 45 };
    expect(checkPlan(context, [monday, tuesday]).some((p) => p.includes("next to"))).toBe(true);
    expect(checkPlan(context, [monday, wednesday, friday]).some((p) => p.includes("at most"))).toBe(true);
  });
});

describe("pickWorkout", () => {
  it("returns null when nothing fits", () => {
    expect(pickWorkout("cycling", "advanced", 45, "easy")).toBeNull();
  });

  it("picks the longest easy workout within the level's cap", () => {
    expect(pickWorkout("running", "beginner", 360, "easy")?.minutes).toBe(40);
    expect(pickWorkout("running", "beginner", 360, "long")?.minutes).toBe(60);
  });
});

describe("estimatedMinutes", () => {
  it("uses the fixed duration of time workouts", () => {
    expect(estimatedMinutes(getWorkout("run_45_3_tempo")!, "beginner")).toBe(45);
  });

  it("estimates swims from the pace per level, beginners taking longer", () => {
    const swim = getWorkout("swim_1000m_1_easy")!;
    const beginner = estimatedMinutes(swim, "beginner")!;
    const advanced = estimatedMinutes(swim, "advanced")!;
    expect(beginner).toBeGreaterThan(advanced);
    expect(beginner % 5).toBe(0);
  });

  it("has no estimate for distance runs and rides", () => {
    expect(estimatedMinutes(getWorkout("run_10km_1_easy")!, "advanced")).toBeNull();
  });
});
