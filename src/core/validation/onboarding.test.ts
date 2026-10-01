import { describe, expect, it } from "vitest";
import { onboardingSchema, type OnboardingInput } from "./onboarding";

const validInput: OnboardingInput = {
  displayName: "  Sam  ",
  dateOfBirth: "1990-05-01",
  workPattern: "shifts",
  sports: [{ sport: "running", level: "beginner" }],
  availability: [60, 0, 90, 0, 45, 120, 0].map((minutes, index) => ({
    weekday: index + 1,
    minutes,
    sports: minutes > 0 ? ["running"] : [],
    // Long run on Saturday (index 5, 120 min).
    longSessions: index === 5 ? ["running"] : [],
  })),
  goal: {
    description: "Marathon",
    sports: ["running"],
    eventName: "",
    eventDate: null,
    racePreset: "marathon",
    segments: [{ sport: "running", distanceMeters: 42_195 }],
  },
};

describe("onboardingSchema", () => {
  it("accepts a complete intake and trims the name", () => {
    const result = onboardingSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    expect(result.data?.displayName).toBe("Sam");
  });

  it("accepts an intake without a goal", () => {
    expect(onboardingSchema.safeParse({ ...validInput, goal: null }).success).toBe(true);
  });

  it("rejects users younger than 16", () => {
    const twoYearsAgo = `${new Date().getFullYear() - 2}-01-01`;
    expect(onboardingSchema.safeParse({ ...validInput, dateOfBirth: twoYearsAgo }).success).toBe(false);
  });

  it("rejects the same sport twice", () => {
    const sports = [
      { sport: "running", level: "beginner" },
      { sport: "running", level: "advanced" },
    ] as const;
    expect(onboardingSchema.safeParse({ ...validInput, sports }).success).toBe(false);
  });

  it("rejects availability that isn't in steps of 15 minutes", () => {
    const availability = validInput.availability.map((day) => ({ ...day, minutes: 50 }));
    expect(onboardingSchema.safeParse({ ...validInput, availability }).success).toBe(false);
  });

  it("rejects less than 30 minutes or more than 6 hours on a training day", () => {
    for (const minutes of [15, 375]) {
      const availability = validInput.availability.map((day) => ({ ...day, minutes }));
      expect(onboardingSchema.safeParse({ ...validInput, availability }).success).toBe(false);
    }
  });

  it("requires a long run day for runners", () => {
    const availability = validInput.availability.map((day) => ({ ...day, longSessions: [] }));
    expect(onboardingSchema.safeParse({ ...validInput, availability }).success).toBe(false);
  });

  it("doesn't require a long session for swimmers only", () => {
    const sports = [{ sport: "swimming", level: "beginner" }] as const;
    const availability = validInput.availability.map((day) => ({
      ...day,
      sports: day.minutes > 0 ? ["swimming" as const] : [],
      longSessions: [],
    }));
    expect(onboardingSchema.safeParse({ ...validInput, sports, availability }).success).toBe(true);
  });

  it("rejects two long runs in one week", () => {
    const availability = validInput.availability.map((day) => ({
      ...day,
      longSessions: day.minutes > 0 ? ["running" as const] : [],
    }));
    expect(onboardingSchema.safeParse({ ...validInput, availability }).success).toBe(false);
  });

  it("rejects a long ride on a day that only allows running", () => {
    const availability = validInput.availability.map((day, index) => ({
      ...day,
      longSessions: index === 5 ? ["cycling" as const] : [],
    }));
    expect(onboardingSchema.safeParse({ ...validInput, availability }).success).toBe(false);
  });

  it("rejects sports on a rest day", () => {
    const availability = validInput.availability.map((day) => ({ ...day, minutes: 0 }));
    expect(onboardingSchema.safeParse({ ...validInput, availability }).success).toBe(false);
  });

  it("rejects unknown race presets", () => {
    const goal = { ...validInput.goal!, racePreset: "moon_marathon" };
    expect(onboardingSchema.safeParse({ ...validInput, goal }).success).toBe(false);
  });
});
