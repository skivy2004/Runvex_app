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

describe("swim days for the AI coach", () => {
  const swimmer: PlannerInput = {
    ...input,
    availability: input.availability.map((day, index) =>
      index === 1 ? { minutes: 60, sports: ["swimming"], longSessions: [] } : day,
    ),
    sports: [...input.sports, { sport: "swimming", level: "intermediate" }],
    swim: { poolLength: 25, equipment: ["fins"] },
  };
  const swimContext = planningContext(swimmer);
  const message = buildPlanMessage(swimmer, swimContext, coach);
  const tuesday = JSON.parse(message.slice(message.indexOf("{"))).openDays.find(
    (day: { date: string }) => day.date === "2026-10-06",
  );

  it("offers blocks instead of whole swims, only with the athlete's equipment", () => {
    expect(tuesday.options).toEqual([]);
    expect(tuesday.swimming.idTemplate).toBe("swim_25_i_{warmup}_{technique}_{main}_{speed or s0}_{cooldown}");
    expect(tuesday.swimming.ownedEquipment).toEqual(["fins"]);
    expect(tuesday.swimming.technique.some((item: string) => item.startsWith("t2:") && item.endsWith(":fins"))).toBe(true);
    expect(tuesday.swimming.technique.some((item: string) => item.startsWith("t3:"))).toBe(false); // snorkel
    expect(tuesday.swimming.speed.length).toBeGreaterThan(0);
  });

  it("accepts a swim the coach built from those blocks", () => {
    const answer = { sessions: [{ date: "2026-10-06", workoutId: "swim_25_i_w1_t2_m1_s1_c1", reason: "Techniek en tempo." }] };
    const sessions = sessionsFromAnswer(swimContext, answer);
    expect(sessions[0].sport).toBe("swimming");
    expect(sessions[0].durationMinutes).toBeGreaterThan(0);
    expect(checkPlan(swimContext, sessions)).toEqual([]);
    // Sculling needs a snorkel, which this athlete doesn't have.
    const noSnorkel = { sessions: [{ ...answer.sessions[0], workoutId: "swim_25_i_w1_t3_m1_s1_c1" }] };
    expect(checkPlan(swimContext, sessionsFromAnswer(swimContext, noSnorkel))).toHaveLength(1);
  });
});
