import { z } from "zod";
import { isAtLeastAge } from "@/core/age";
import {
  dayAllowsSport,
  isValidDayMinutes,
  longSessionSports,
  missingLongSessions,
} from "@/core/availability";
import { isGoalPresetChoice, MAX_GOAL_DISTANCE_M } from "@/core/racePresets";
import { experienceLevels, sports, workPatterns } from "@/core/training";

// GDPR (AVG): in the Netherlands you must be 16 to consent yourself.
export const MIN_AGE = 16;

const isoDate = z.iso.date();

const uniqueSports = z
  .array(z.enum(sports))
  .refine((items) => new Set(items).size === items.length);

/** Time, sports and long sessions per weekday, exactly one entry for each of the 7 days. */
export const availabilitySchema = z
  .array(
    z
      .object({
        weekday: z.number().int().min(1).max(7),
        minutes: z.number().int().refine(isValidDayMinutes),
        sports: uniqueSports,
        longSessions: z
          .array(z.enum(longSessionSports))
          .refine((items) => new Set(items).size === items.length),
      })
      // A rest day has no sports, and a long session needs its sport to fit the day.
      .refine((day) => day.minutes > 0 || day.sports.length === 0)
      .refine((day) => day.longSessions.every((sport) => dayAllowsSport(day, sport))),
  )
  .length(7)
  .refine((items) => new Set(items.map((item) => item.weekday)).size === 7)
  // At most one long run and one long ride per week.
  .refine((items) =>
    longSessionSports.every(
      (sport) => items.filter((item) => item.longSessions.includes(sport)).length <= 1,
    ),
  );

/** Name and date of birth: editable on their own in the profile settings. */
export const profileDetailsSchema = z.object({
  displayName: z.string().trim().max(80),
  dateOfBirth: isoDate.refine(
    (value) => value >= "1900-01-01" && isAtLeastAge(value, MIN_AGE),
    "tooYoung",
  ),
});

/** Everything about training: what you can redo without the personal details. */
const trainingProfileFields = z.object({
  workPattern: z.enum(workPatterns),
  sports: z
    .array(z.object({ sport: z.enum(sports), level: z.enum(experienceLevels) }))
    .min(1)
    .refine((items) => new Set(items.map((item) => item.sport)).size === items.length),
  availability: availabilitySchema,
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

/** Runners need a long run day and cyclists a long ride day. */
function hasRequiredLongSessions(profile: z.output<typeof trainingProfileFields>): boolean {
  const userSports = profile.sports.map((item) => item.sport);
  return missingLongSessions(profile.availability, userSports).length === 0;
}

export const trainingProfileSchema = trainingProfileFields.refine(
  hasRequiredLongSessions,
  "missingLongSessions",
);

/** The first intake: personal details and training profile together. */
export const onboardingSchema = profileDetailsSchema
  .extend(trainingProfileFields.shape)
  .refine(hasRequiredLongSessions, "missingLongSessions");

/** What the form sends. */
export type OnboardingInput = z.input<typeof onboardingSchema>;
/** What's left after validation (e.g. names are trimmed). */
export type OnboardingData = z.output<typeof onboardingSchema>;

export type TrainingProfileInput = z.input<typeof trainingProfileSchema>;
export type TrainingProfileData = z.output<typeof trainingProfileSchema>;

export type ProfileDetailsInput = z.input<typeof profileDetailsSchema>;
export type ProfileDetailsData = z.output<typeof profileDetailsSchema>;
