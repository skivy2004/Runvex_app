import { describe, expect, it } from "vitest";
import type { CurrentGoal } from "@/services/goals";
import { draftFromTrainingProfile, isStepComplete, redoSteps, toTrainingProfileInput } from "./draft";

const baseProfile = {
  sports: [
    { sport: "swimming", level: "beginner" },
    { sport: "running", level: "advanced" },
  ] as const,
  workPattern: "shifts" as const,
  availability: [90, 0, 120, 0, 60, 180, 0].map((minutes, index) => ({
    minutes,
    sports: minutes > 0 ? (["swimming", "running"] as const) : [],
    // Long run on Saturday.
    longSessions: index === 5 ? (["running"] as const) : [],
  })),
};

const goal = (overrides: Partial<CurrentGoal>): CurrentGoal => ({
  id: "goal",
  description: "My goal",
  sports: [],
  event_name: null,
  event_date: null,
  race_preset: null,
  created_at: "2026-10-01T00:00:00Z",
  segments: [],
  ...overrides,
});

/** Loading saved answers into the intake and saving them again must change nothing. */
function roundTrip(savedGoal: CurrentGoal | null) {
  const draft = draftFromTrainingProfile({
    ...baseProfile,
    sports: [...baseProfile.sports],
    availability: baseProfile.availability.map((day) => ({
      ...day,
      sports: [...day.sports],
      longSessions: [...day.longSessions],
    })),
    goal: savedGoal,
  });
  return { draft, saved: toTrainingProfileInput(draft) };
}

describe("draftFromTrainingProfile", () => {
  it("keeps sports, levels, schedule and availability", () => {
    const { saved } = roundTrip(null);
    expect(saved.sports).toEqual(baseProfile.sports);
    expect(saved.workPattern).toBe("shifts");
    expect(
      saved.availability.map(({ minutes, sports, longSessions }) => ({ minutes, sports, longSessions })),
    ).toEqual(baseProfile.availability);
    expect(saved.goal).toBeNull();
  });

  it("drops day sports and long sessions that are no longer among the user's sports", () => {
    const { draft } = roundTrip(null);
    const withoutRunning = { ...draft, sports: draft.sports.filter((sport) => sport !== "running") };
    const saved = toTrainingProfileInput(withoutRunning);
    expect(saved.availability.every((day) => !day.sports.includes("running"))).toBe(true);
    expect(saved.availability.every((day) => day.longSessions.length === 0)).toBe(true);
  });

  it("keeps a preset goal with its exact distances", () => {
    const { draft, saved } = roundTrip(
      goal({
        description: "Ironman 70.3",
        sports: ["swimming", "cycling", "running"],
        event_name: "Challenge Almere",
        event_date: "2027-09-11",
        race_preset: "ironman_70_3",
        segments: [
          { sport: "swimming", distanceMeters: 1900 },
          { sport: "cycling", distanceMeters: 90000 },
          { sport: "running", distanceMeters: 21098 },
        ],
      }),
    );
    expect(draft.goalCategory).toBe("triathlon");
    expect(saved.goal).toMatchObject({
      racePreset: "ironman_70_3",
      eventName: "Challenge Almere",
      eventDate: "2027-09-11",
      segments: [
        { sport: "swimming", distanceMeters: 1900 },
        { sport: "cycling", distanceMeters: 90000 },
        { sport: "running", distanceMeters: 21098 },
      ],
    });
  });

  it("keeps a custom distance", () => {
    const { draft, saved } = roundTrip(
      goal({
        description: "15 km trail",
        sports: ["running"],
        race_preset: "custom",
        segments: [{ sport: "running", distanceMeters: 15000 }],
      }),
    );
    expect(draft.goalCategory).toBe("running");
    expect(saved.goal?.segments).toEqual([{ sport: "running", distanceMeters: 15000 }]);
  });

  it("keeps a goal without distance", () => {
    const { draft, saved } = roundTrip(goal({ description: "Deadlift 100 kg", sports: ["strength"] }));
    expect(draft.goalCategory).toBe("other");
    expect(saved.goal).toMatchObject({ sports: ["strength"], racePreset: null, segments: [] });
  });

  it("starts with every redo step already complete", () => {
    const { draft } = roundTrip(null);
    for (const step of redoSteps) expect(isStepComplete(step, draft)).toBe(true);
  });
});
