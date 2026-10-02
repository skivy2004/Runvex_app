import { z } from "zod";
import { isValidIsoDate } from "@/core/week";
import { sports } from "@/core/training";

// Checks for changing planned workouts. Used in the Server Actions, because
// anyone can call those with any data.

export const MIN_WORKOUT_MINUTES = 5;
export const MAX_WORKOUT_MINUTES = 600;
export const MAX_TITLE_LENGTH = 120;

const isoDate = z.string().refine(isValidIsoDate, "invalidDate");
const id = z.uuid();

/** A training the user adds: from the library (templateId) or their own (title + minutes). */
export const addWorkoutSchema = z
  .object({
    date: isoDate,
    sport: z.enum(sports),
    templateId: z.string().nullable(),
    title: z.string().trim().max(MAX_TITLE_LENGTH),
    durationMinutes: z.number().int().min(MIN_WORKOUT_MINUTES).max(MAX_WORKOUT_MINUTES).nullable(),
  })
  // Your own training needs a title and a duration; a library workout brings its own.
  .refine(
    (data) => data.templateId !== null || (data.title.length > 0 && data.durationMinutes !== null),
    "missingTitleOrDuration",
  );
export type AddWorkoutInput = z.input<typeof addWorkoutSchema>;

export const moveWorkoutSchema = z.object({ id, date: isoDate });
export const swapWorkoutSchema = z.object({ id, templateId: z.string().min(1) });
export const deleteWorkoutSchema = z.object({ id });
