// Training domain values. Keep these lists in sync with the enums in the
// database (supabase/migrations); TypeScript checks this in services/.

export const sports = ["running", "cycling", "swimming", "strength"] as const;
export type Sport = (typeof sports)[number];

export const experienceLevels = ["beginner", "intermediate", "advanced"] as const;
export type ExperienceLevel = (typeof experienceLevels)[number];

export const workPatterns = ["fixed", "variable", "shifts"] as const;
export type WorkPattern = (typeof workPatterns)[number];

/** A triathlon isn't a sport of its own, it's a goal combining these three. */
export const triathlonSports: Sport[] = ["swimming", "cycling", "running"];

/** ISO weekdays: index 0 = Monday (weekday 1) ... index 6 = Sunday (weekday 7). */
export const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
