import { describe, expect, it } from "vitest";
import { buildPlanMessage, sessionsFromAnswer, type CoachContext } from "./aiPlan";
import { checkPlan, planningContext, type PlannerInput } from "./planner";

const input: PlannerInput = {
  weekStart: "2026-10-05",
  today: "2026-10-01",
  availability: [
    { minutes: 60, sports: [], longSessions: [] },
    { minutes: 0, sports: [], longSessions: [] },
    { minutes: 45, sports: ["running"], longSessions: [] },
    { minutes: 0, sports: [], longSessions: [] },
    { minutes: 0, sports: [], longSessions: [] },
    { minutes: 120, sports: [], longSessions: ["cycling"] },
    { minutes: 90, sports: ["running"], longSessions: ["running"] },
  ],
  sports: [
    { sport: "running", level: "intermediate" },
    { sport: "cycling", level: "beginner" },
  ],
  existing: [],
  recentTemplateIds: ["run_60_1_easy"],
  goal: { sports: ["running"], eventDate: "2026-12-13" },
};
const coach: CoachContext = {
  locale: "nl",
  workPattern: "shifts",
  goal: { description: "Halve marathon uitlopen", racePreset: "half_marathon", eventDate: "2026-12-13" },
};
const context = planningContext(input);

describe("buildPlanMessage", () => {
  const message = buildPlanMessage(input, context, coach);
  const week = JSON.parse(message.slice(message.indexOf("{")));

  it("lists the open days with only the workouts allowed there", () => {
    expect(week.openDays.map((day: { date: string }) => day.date)).toEqual([
      "2026-10-05",
      "2026-10-07",
      "2026-10-10",
      "2026-10-11",
    ]);
    // Wednesday only allows running and has 45 minutes.
    const wednesday = week.openDays[1];
    expect(wednesday.options).toContain("run_45_3_tempo:45");
    expect(wednesday.options.every((option: string) => option.startsWith("run_"))).toBe(true);
    // The long ride day only offers calm rides.
    expect(week.openDays[2].options.every((o: string) => /^bike_\d+min_[12]_/.test(o))).toBe(true);
  });

  it("tells the coach the language, level and goal, but nothing personal", () => {
    expect(week.language).toBe("Dutch");
    expect(week.athlete.sports).toContain("cycling: beginner");
    expect(week.goal).toMatchObject({ race: "half_marathon", weeksToGo: 10 });
    expect(message).not.toMatch(/name|email|birth/i);
  });
});

describe("sessionsFromAnswer", () => {
  it("turns a valid answer into sessions that pass the rules", () => {
    const sessions = sessionsFromAnswer(context, {
      sessions: [
        { date: "2026-10-05", workoutId: "run_40_1_easy", reason: "Rustig beginnen." },
        { date: "2026-10-07", workoutId: "run_45_3_tempo", reason: "Eén tempoblok." },
        { date: "2026-10-10", workoutId: "bike_120min_1_easy", reason: "Lange rit." },
        { date: "2026-10-11", workoutId: "run_90_1_easy", reason: "Lange duurloop." },
      ],
    });
    expect(sessions[1]).toMatchObject({ sport: "running", durationMinutes: 45 });
    expect(checkPlan(context, sessions)).toEqual([]);
  });

  it("lets checkPlan reject made-up workouts and days", () => {
    const sessions = sessionsFromAnswer(context, {
      sessions: [
        { date: "2026-10-06", workoutId: "run_40_1_easy", reason: "" },
        { date: "2026-10-05", workoutId: "run_made_up", reason: "" },
      ],
    });
    expect(checkPlan(context, sessions)).toHaveLength(2);
  });

  it("shortens very long reasons", () => {
    const [session] = sessionsFromAnswer(context, {
      sessions: [{ date: "2026-10-05", workoutId: "run_40_1_easy", reason: "x".repeat(1000) }],
    });
    expect(session.reason).toHaveLength(300);
  });
});
