import { z } from "zod";
import { isAtLeastAge } from "@/core/age";
import { isGoalPresetChoice, MAX_GOAL_DISTANCE_M } from "@/core/racePresets";
import { experienceLevels, sports, workPatterns } from "@/core/training";

// GDPR (AVG): in the Netherlands you must be 16 to consent yourself.
export const MIN_AGE = 16;
export const MAX_DAILY_MINUTES = 300;
export const MINUTES_STEP = 15;

const isoDate = z.iso.date();

export const onboardingSchema = z.object({
  displayName: z.string().trim().max(80),
  dateOfBirth: isoDate.refine(
    (value) => value >= "1900-01-01" && isAtLeastAge(value, MIN_AGE),
    "tooYoung",
  ),
  workPattern: z.enum(workPatterns),
  sports: z
    .array(z.object({ sport: z.enum(sports), level: z.enum(experienceLevels) }))
    .min(1)
    .refine((items) => new Set(items.map((item) => item.sport)).size === items.length),
  availability: z
    .array(
      z.object({
        weekday: z.number().int().min(1).max(7),
        minutes: z.number().int().min(0).max(MAX_DAILY_MINUTES).multipleOf(MINUTES_STEP),
      }),
    )
    .length(7)
    .refine((items) => new Set(items.map((item) => item.weekday)).size === 7),
  // null = "no specific goal"
  goal: z
    .object({
      description: z.string().trim().min(1).max(500),
      sports: z.array(z.enum(sports)),
      eventName: z.string().trim().max(120),
      eventDate: isoDate.nullable(),
      // null for goals without a distance (category "other").
      racePreset: z.string().refine(isGoalPresetChoice).nullable(),
      segments: z
        .array(
          z.object({
            sport: z.enum(sports),
            distanceMeters: z.number().int().positive().max(MAX_GOAL_DISTANCE_M),
          }),
        )
        .max(3),
    })
    .nullable(),
});

/** What the form sends. */
export type OnboardingInput = z.input<typeof onboardingSchema>;
/** What's left after validation (e.g. names are trimmed). */
export type OnboardingData = z.output<typeof onboardingSchema>;
