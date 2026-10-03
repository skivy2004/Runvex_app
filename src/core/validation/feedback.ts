import { z } from "zod";

// Checking off a training: done (with how hard it felt) or skipped, or back to planned.

export const workoutStatuses = ["planned", "done", "skipped"] as const;
export type WorkoutStatus = (typeof workoutStatuses)[number];

export const MAX_FEEDBACK_NOTE_LENGTH = 500;

export const workoutFeedbackSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(workoutStatuses),
    /** Rate of perceived exertion: 1 = very easy ... 10 = maximal. */
    rpe: z.number().int().min(1).max(10).nullable(),
    note: z
      .string()
      .trim()
      .max(MAX_FEEDBACK_NOTE_LENGTH)
      .transform((note) => note || null)
      .nullable(),
  })
  // Like in the database: RPE and a note only for a training you did.
  .refine((data) => data.status === "done" || (data.rpe === null && data.note === null), "feedbackNeedsDone");

export type WorkoutFeedbackInput = z.input<typeof workoutFeedbackSchema>;

/** The status of a training as stored, with anything unexpected treated as planned. */
export function statusOf(value: string): WorkoutStatus {
  return (workoutStatuses as readonly string[]).includes(value) ? (value as WorkoutStatus) : "planned";
}

/** Done and skipped trainings can only be checked off from their day on, not in advance. */
export function canCheckOff(date: string, today: string): boolean {
  return date <= today;
}
