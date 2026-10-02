import { describe, expect, it } from "vitest";
import { addWorkoutSchema, moveWorkoutSchema, type AddWorkoutInput } from "./workouts";

const own: AddWorkoutInput = {
  date: "2026-10-05",
  sport: "strength",
  templateId: null,
  title: "  Core and legs  ",
  durationMinutes: 45,
};

describe("addWorkoutSchema", () => {
  it("accepts your own training and trims the title", () => {
    expect(addWorkoutSchema.parse(own).title).toBe("Core and legs");
  });

  it("accepts a library workout without title or duration", () => {
    const library = { ...own, sport: "running", templateId: "run_45_3_tempo", title: "", durationMinutes: null };
    expect(addWorkoutSchema.safeParse(library).success).toBe(true);
  });

  it("needs a title and duration for your own training", () => {
    expect(addWorkoutSchema.safeParse({ ...own, title: "   " }).success).toBe(false);
    expect(addWorkoutSchema.safeParse({ ...own, durationMinutes: null }).success).toBe(false);
  });

  it("rejects impossible dates and durations", () => {
    expect(addWorkoutSchema.safeParse({ ...own, date: "2026-02-31" }).success).toBe(false);
    expect(addWorkoutSchema.safeParse({ ...own, durationMinutes: 2 }).success).toBe(false);
    expect(addWorkoutSchema.safeParse({ ...own, durationMinutes: 601 }).success).toBe(false);
  });
});

describe("moveWorkoutSchema", () => {
  it("needs a real workout id and date", () => {
    const id = "6f1c2b8e-3a4d-4e5f-9a6b-7c8d9e0f1a2b";
    expect(moveWorkoutSchema.safeParse({ id, date: "2026-10-06" }).success).toBe(true);
    expect(moveWorkoutSchema.safeParse({ id: "1; drop table", date: "2026-10-06" }).success).toBe(false);
  });
});
