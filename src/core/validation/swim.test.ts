import { describe, expect, it } from "vitest";
import { swimSettingsOf, swimSettingsSchema } from "./swim";

describe("swimSettingsSchema", () => {
  it("accepts a pool length and known equipment", () => {
    expect(swimSettingsSchema.safeParse({ poolLength: 25, equipment: [] }).success).toBe(true);
    expect(swimSettingsSchema.safeParse({ poolLength: 50, equipment: ["fins", "snorkel"] }).success).toBe(true);
  });

  it("rejects other pools, unknown or duplicate equipment", () => {
    expect(swimSettingsSchema.safeParse({ poolLength: 33, equipment: [] }).success).toBe(false);
    expect(swimSettingsSchema.safeParse({ poolLength: 25, equipment: ["flippers"] }).success).toBe(false);
    expect(swimSettingsSchema.safeParse({ poolLength: 25, equipment: ["fins", "fins"] }).success).toBe(false);
  });
});

describe("swimSettingsOf", () => {
  it("reads the profile row and ignores unknown values", () => {
    expect(swimSettingsOf({ pool_length: 50, swim_equipment: ["snorkel", "fins", "old"] })).toEqual({
      poolLength: 50,
      equipment: ["fins", "snorkel"],
    });
    expect(swimSettingsOf({ pool_length: 25, swim_equipment: [] })).toEqual({ poolLength: 25, equipment: [] });
  });
});
