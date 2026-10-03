import { describe, expect, it } from "vitest";
import type { CoachContext } from "@/core/aiPlan";
import { checkPlan, isHardWorkout, planningContext, type PlannerInput } from "@/core/planner";
import { getWorkout } from "@/core/workouts/library";
import { buildOutlineMessage, buildSpecialistMessage, checkOutline, sessionsFromTeam, type Outline } from "./teamPlan";

// Monday 5 October 2026: run/bike/swim days, a long ride on Saturday and a long run on Sunday.
const input: PlannerInput = {
  weekStart: "2026-10-05",
  today: "2026-10-01",
  availability: [
    { minutes: 60, sports: [], longSessions: [] },
    { minutes: 60, sports: [], longSessions: [] },
    { minutes: 60, sports: [], longSessions: [] },
    { minutes: 0, sports: [], longSessions: [] },
    { minutes: 60, sports: ["swimming"], longSessions: [] },
    { minutes: 180, sports: [], longSessions: ["cycling"] },
    { minutes: 90, sports: ["running"], longSessions: ["running"] },
  ],
  sports: [
    { sport: "running", level: "intermediate" },
    { sport: "cycling", level: "intermediate" },
    { sport: "swimming", level: "intermediate" },
  ],
  existing: [],
  recentTemplateIds: [],
  goal: null,
  swim: { poolLength: 25, equipment: ["fins"] },
};
const coach: CoachContext = { locale: "nl", workPattern: "shifts", goal: null };
const context = planningContext(input);

const day = (date: string, sport: Outline["days"][number]["sport"], kind: Outline["days"][number]["kind"]) => ({
  date,
  sport,
  kind,
  note: "note",
});

describe("checkOutline", () => {
  it("keeps a good outline and forces the long sessions", () => {
    const assignments = checkOutline(context, {
      summary: "",
      days: [
        day("2026-10-05", "running", "easy"),
        day("2026-10-06", "cycling", "hard"),
        day("2026-10-07", "swimming", "easy"),
        day("2026-10-10", "cycling", "easy"), // long ride day: becomes long
        day("2026-10-11", "running", "long"),
      ],
    });
    expect(assignments.map((item) => `${item.day.date} ${item.sport} ${item.kind}`)).toEqual([
      "2026-10-05 running easy",
      "2026-10-06 cycling hard",
      "2026-10-07 swimming easy",
      "2026-10-10 cycling long",
      "2026-10-11 running long",
    ]);
  });

  it("makes a hard day next to another hard day easy, and drops what doesn't fit", () => {
    const assignments = checkOutline(context, {
      summary: "",
      days: [
        day("2026-10-05", "running", "hard"),
        day("2026-10-06", "cycling", "hard"), // next to Monday
        day("2026-10-08", "running", "easy"), // Thursday is a rest day
        day("2026-10-09", "running", "easy"), // Friday is only for swimming
        day("2026-10-07", "rest", "easy"),
      ],
    });
    expect(assignments.map((item) => `${item.day.date} ${item.kind}`)).toEqual(["2026-10-05 hard", "2026-10-06 easy"]);
  });
});

describe("messages", () => {
  it("gives the head coach the kinds per sport and each specialist only its own options", () => {
    const outline = buildOutlineMessage(input, context, coach);
    expect(outline).toContain('"longSession":"cycling"');
    const assignments = checkOutline(context, { summary: "", days: [day("2026-10-05", "running", "easy"), day("2026-10-09", "swimming", "easy")] });
    const run = buildSpecialistMessage("running", assignments.filter((a) => a.sport === "running"), input, context, coach);
    expect(run).toContain("run_");
    expect(run).not.toContain("bike_");
    const swim = buildSpecialistMessage("swimming", assignments.filter((a) => a.sport === "swimming"), input, context, coach);
    expect(swim).toContain('"idTemplate":"swim_25_i_');
    expect(swim).toContain('"speed":[]'); // an easy swim: no speed blocks
  });
});

describe("sessionsFromTeam", () => {
  const assignments = checkOutline(context, {
    summary: "",
    days: [day("2026-10-05", "running", "easy"), day("2026-10-06", "cycling", "hard"), day("2026-10-09", "swimming", "easy")],
  });

  it("uses the specialist's choice when it fits, and the rules otherwise", () => {
    const sessions = sessionsFromTeam(input, context, assignments, {
      running: { summary: "", sessions: [{ date: "2026-10-05", workoutId: "run_45_1_easy", reason: "Rustig beginnen." }] },
      // An easy ride on the hard day: doesn't fit, so the rules pick a hard one.
      cycling: { summary: "", sessions: [{ date: "2026-10-06", workoutId: "bike_60min_1_easy", reason: "x" }] },
      swimming: null, // didn't answer
    });
    expect(sessions).toHaveLength(3);
    expect(sessions[0]).toMatchObject({ templateId: "run_45_1_easy", reason: "Rustig beginnen." });
    expect(isHardWorkout(getWorkout(sessions[1].templateId)!)).toBe(true);
    expect(sessions[1].reason).toBe("note");
    expect(sessions[2].sport).toBe("swimming");
    expect(checkPlan(context, sessions)).toEqual([]);
  });
});
