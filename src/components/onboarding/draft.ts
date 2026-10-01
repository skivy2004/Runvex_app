import { isAtLeastAge } from "@/core/age";
import {
  emptyWeek,
  missingLongSessions,
  normalizeDay,
  type DayAvailability,
} from "@/core/availability";
import {
  categorySports,
  CUSTOM_PRESET,
  distanceUnit,
  findPreset,
  parseDistanceInput,
  type DistanceCategory,
  type GoalCategory,
  type GoalPresetChoice,
  type Segment,
} from "@/core/racePresets";
import type { ExperienceLevel, Sport, WorkPattern } from "@/core/training";
import {
  MIN_AGE,
  type OnboardingInput,
  type TrainingProfileInput,
} from "@/core/validation/onboarding";
import type { CurrentGoal } from "@/services/goals";

/** The intake answers while the user is still filling them in. */
export type OnboardingDraft = {
  displayName: string;
  dateOfBirth: string;
  sports: Sport[];
  levels: Partial<Record<Sport, ExperienceLevel>>;
  goalChoice: "goal" | "none" | null;
  goalCategory: GoalCategory | null;
  goalPreset: GoalPresetChoice | null;
  /** What the user typed per sport, in meters (swimming) or km (others). */
  goalDistances: Partial<Record<Sport, string>>;
  goalDescription: string;
  /** True once the user typed their own description: we then stop auto-filling it. */
  goalDescriptionEdited: boolean;
  /** Only used for the "other" category, which has no distances. */
  goalSports: Sport[];
  eventName: string;
  eventDate: string;
  workPattern: WorkPattern | null;
  /** Time and sports per weekday, index 0 = Monday. 0 minutes = rest day. */
  availability: DayAvailability[];
};

export const initialDraft: OnboardingDraft = {
  displayName: "",
  dateOfBirth: "",
  sports: [],
  levels: {},
  goalChoice: null,
  goalCategory: null,
  goalPreset: null,
  goalDistances: {},
  goalDescription: "",
  goalDescriptionEdited: false,
  goalSports: [],
  eventName: "",
  eventDate: "",
  workPattern: null,
  availability: emptyWeek(),
};

export const onboardingSteps = ["about", "sports", "levels", "goal", "work", "availability"] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];

/** Redoing the intake skips "about": name and date of birth are edited in the profile. */
export const redoSteps = onboardingSteps.filter((step) => step !== "about");

export function isOldEnough(dateOfBirth: string) {
  return dateOfBirth >= "1900-01-01" && isAtLeastAge(dateOfBirth, MIN_AGE);
}

/**
 * The goal's distances in meters, or null while a distance is missing or invalid.
 * A preset uses its exact distances; "custom" uses what the user typed.
 */
export function goalSegments(draft: OnboardingDraft): Segment[] | null {
  const category = draft.goalCategory;
  if (category === null || category === "other") return [];

  const preset = findPreset(draft.goalPreset);
  if (preset) return preset.segments.map((segment) => ({ ...segment }));

  const segments: Segment[] = [];
  for (const sport of categorySports[category]) {
    const distanceMeters = parseDistanceInput(sport, draft.goalDistances[sport] ?? "");
    if (distanceMeters === null) return null;
    segments.push({ sport, distanceMeters });
  }
  return segments;
}

function isGoalComplete(draft: OnboardingDraft): boolean {
  if (draft.goalChoice === "none") return true;
  if (draft.goalChoice !== "goal" || draft.goalCategory === null) return false;
  if (draft.goalDescription.trim() === "") return false;
  if (draft.goalCategory === "other") return draft.goalSports.length > 0;
  return draft.goalPreset !== null && goalSegments(draft) !== null;
}

/** Whether the "Next" button may be used on this step. */
export function isStepComplete(step: OnboardingStep, draft: OnboardingDraft): boolean {
  switch (step) {
    case "about":
      return draft.dateOfBirth !== "" && isOldEnough(draft.dateOfBirth);
    case "sports":
      return draft.sports.length > 0;
    case "levels":
      return draft.sports.every((sport) => draft.levels[sport] !== undefined);
    case "goal":
      return isGoalComplete(draft);
    case "work":
      return draft.workPattern !== null;
    case "availability":
      // Runners must pick a long run day and cyclists a long ride day.
      return missingLongSessions(draft.availability, draft.sports).length === 0;
  }
}

function toGoalInput(draft: OnboardingDraft): OnboardingInput["goal"] {
  const category = draft.goalCategory;
  if (draft.goalChoice !== "goal" || category === null) return null;

  const isOther = category === "other";
  return {
    description: draft.goalDescription,
    sports: isOther ? draft.goalSports : [...categorySports[category]],
    eventName: draft.eventName,
    eventDate: draft.eventDate || null,
    racePreset: isOther ? null : draft.goalPreset,
    segments: goalSegments(draft) ?? [],
  };
}

/** The training part of the draft, in the shape the server expects. */
export function toTrainingProfileInput(draft: OnboardingDraft): TrainingProfileInput {
  return {
    // Only reached after the "work" step is complete, so it's never null here.
    workPattern: draft.workPattern ?? "fixed",
    sports: draft.sports.map((sport) => ({ sport, level: draft.levels[sport] ?? "beginner" })),
    availability: draft.availability.map((day, index) => {
      // Drop sports the user removed in the sports step, then whatever no longer fits the day.
      const isUserSport = (sport: Sport) => draft.sports.includes(sport);
      const cleaned = normalizeDay({
        minutes: day.minutes,
        sports: day.sports.filter(isUserSport),
        longSessions: day.longSessions.filter(isUserSport),
      });
      return { weekday: index + 1, ...cleaned };
    }),
    goal: toGoalInput(draft),
  };
}

/** The whole first intake, in the shape the server expects. */
export function toOnboardingInput(draft: OnboardingDraft): OnboardingInput {
  return {
    displayName: draft.displayName,
    dateOfBirth: draft.dateOfBirth,
    ...toTrainingProfileInput(draft),
  };
}

/** Which goal category fits these distances, e.g. swim + bike + run = triathlon. */
function categoryForSegments(segments: Segment[]): GoalCategory {
  const sportsInOrder = segments.map((segment) => segment.sport).join(",");
  const match = (Object.keys(categorySports) as DistanceCategory[]).find(
    (category) => categorySports[category].join(",") === sportsInOrder,
  );
  return match ?? "other";
}

/** Distance as typed text: meters for swimming, kilometers for the rest. */
function toDistanceText(segment: Segment): string {
  return distanceUnit(segment.sport) === "m"
    ? String(segment.distanceMeters)
    : String(segment.distanceMeters / 1000);
}

type SavedTrainingProfile = {
  sports: { sport: Sport; level: ExperienceLevel }[];
  workPattern: WorkPattern | null;
  availability: DayAvailability[];
  goal: CurrentGoal | null;
};

/** Fills the intake with the user's current answers, for redoing it. */
export function draftFromTrainingProfile(saved: SavedTrainingProfile): OnboardingDraft {
  const { goal } = saved;
  const goalCategory = goal
    ? findPreset(goal.race_preset)?.category ?? categoryForSegments(goal.segments)
    : null;

  return {
    ...initialDraft,
    sports: saved.sports.map((item) => item.sport),
    levels: Object.fromEntries(saved.sports.map((item) => [item.sport, item.level])),
    workPattern: saved.workPattern,
    availability: saved.availability.map((day) => ({
      ...day,
      sports: [...day.sports],
      longSessions: [...day.longSessions],
    })),
    goalChoice: goal ? "goal" : "none",
    goalCategory,
    goalPreset:
      goal && goalCategory !== "other"
        ? findPreset(goal.race_preset)?.key ?? CUSTOM_PRESET
        : null,
    goalDistances: Object.fromEntries(
      (goal?.segments ?? []).map((segment) => [segment.sport, toDistanceText(segment)]),
    ),
    goalDescription: goal?.description ?? "",
    // The saved description is the user's: don't overwrite it automatically.
    goalDescriptionEdited: goal !== null,
    goalSports: goalCategory === "other" ? [...(goal?.sports ?? [])] : [],
    eventName: goal?.event_name ?? "",
    eventDate: goal?.event_date ?? "",
  };
}

/** Adds the item to the list, or removes it when it's already there. */
export function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}
