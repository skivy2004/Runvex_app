import { describe, expect, it } from "vitest";
import { getWorkout } from "@/core/workouts/library";
import { belongsOnWatch, toIntervalsEvent, workoutText } from "./intervals";

describe("workoutText", () => {
  it("writes warm-up, repeats and cool-down with heart rate targets", () => {
    const workout = getWorkout("bike_75min_4_threshold")!;
    expect(workoutText(workout.steps, "cycling", "en")).toBe(
      [
        "Warmup",
        "- 15m 50-60% HR",
        "",
        "- 10m 60-70% HR",
        "",
        "4x",
        "- 5m 80-90% HR",
        "- Recovery 3m 60-70% HR",
        "",
        "- 3m 60-70% HR",
        "",
        "Cooldown",
        "- 15m 50-60% HR",
      ].join("\n"),
    );
  });

  it("shows walking as a cue in the user's language", () => {
    const text = workoutText(getWorkout("run_45_2_progressive")!.steps, "running", "nl");
    expect(text.split("\n")[1]).toBe("- Wandelen 5m 50-60% HR");
  });

  it("uses meters, pace zones and rests for swims", () => {
    const text = workoutText(getWorkout("swim_1000m_2_endurance")!.steps, "swimming", "en");
    expect(text).toContain("Warmup\n- 200mtr Z1 Pace");
    expect(text).toContain("6x\n- 100mtr Z2 Pace\n- 15s 0% Pace");
  });
});

describe("toIntervalsEvent", () => {
  const training = {
    id: "6f1c2b8e-3a4d-4e5f-9a6b-7c8d9e0f1a2b",
    scheduled_on: "2026-10-05",
    sport: "running" as const,
    title: "Tempo",
    duration_minutes: 45,
    template_id: "run_45_3_tempo",
  };

  it("uses our id as external id, the date, the type and the duration", () => {
    expect(toIntervalsEvent(training, "en")).toMatchObject({
      external_id: training.id,
      category: "WORKOUT",
      start_date_local: "2026-10-05T00:00:00",
      type: "Run",
      moving_time: 2700,
    });
  });

  it("sends your own training with its title and no steps", () => {
    const own = { ...training, sport: "strength" as const, title: "Core", template_id: null };
    expect(toIntervalsEvent(own, "nl")).toMatchObject({ type: "WeightTraining", name: "Core", description: "" });
  });
});

describe("belongsOnWatch", () => {
  it("keeps swims off the watch and sends the rest", () => {
    expect(belongsOnWatch({ sport: "swimming" })).toBe(false);
    expect(belongsOnWatch({ sport: "running" })).toBe(true);
    expect(belongsOnWatch({ sport: "cycling" })).toBe(true);
    expect(belongsOnWatch({ sport: "strength" })).toBe(true);
  });
});
