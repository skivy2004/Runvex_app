import { describe, expect, it } from "vitest";
import { canCheckOff, statusOf, workoutFeedbackSchema } from "./feedback";

const id = "6f1c1f9e-5b6e-4e7a-9a43-6a1d6c2f8b11";

describe("workoutFeedbackSchema", () => {
  it("accepts done with RPE and a note, skipped, and back to planned", () => {
    expect(workoutFeedbackSchema.safeParse({ id, status: "done", rpe: 7, note: "Zware benen" }).success).toBe(true);
    expect(workoutFeedbackSchema.safeParse({ id, status: "done", rpe: null, note: null }).success).toBe(true);
    expect(workoutFeedbackSchema.safeParse({ id, status: "skipped", rpe: null, note: null }).success).toBe(true);
    expect(workoutFeedbackSchema.safeParse({ id, status: "planned", rpe: null, note: null }).success).toBe(true);
  });

  it("stores an empty note as no note", () => {
    expect(workoutFeedbackSchema.parse({ id, status: "done", rpe: 5, note: "   " }).note).toBeNull();
  });

  it("rejects RPE outside 1-10, RPE for a skipped training and unknown statuses", () => {
    expect(workoutFeedbackSchema.safeParse({ id, status: "done", rpe: 11, note: null }).success).toBe(false);
    expect(workoutFeedbackSchema.safeParse({ id, status: "done", rpe: 0, note: null }).success).toBe(false);
    expect(workoutFeedbackSchema.safeParse({ id, status: "skipped", rpe: 4, note: null }).success).toBe(false);
    expect(workoutFeedbackSchema.safeParse({ id, status: "half", rpe: null, note: null }).success).toBe(false);
    expect(workoutFeedbackSchema.safeParse({ id, status: "done", rpe: 5, note: "x".repeat(501) }).success).toBe(false);
  });
});

describe("statusOf and canCheckOff", () => {
  it("reads the stored status", () => {
    expect(statusOf("done")).toBe("done");
    expect(statusOf("other")).toBe("planned");
  });

  it("only checks off trainings from their day on", () => {
    expect(canCheckOff("2026-10-03", "2026-10-03")).toBe(true);
    expect(canCheckOff("2026-10-01", "2026-10-03")).toBe(true);
    expect(canCheckOff("2026-10-04", "2026-10-03")).toBe(false);
  });
});
