import { isAtLeastAge } from "@/core/age";
import {
  categorySports,
  findPreset,
  parseDistanceInput,
  type GoalCategory,
  type GoalPresetChoice,
  type Segment,
} from "@/core/racePresets";
import type { ExperienceLevel, Sport, WorkPattern } from "@/core/training";
import { MIN_AGE, type OnboardingInput } from "@/core/validation/onboarding";

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
  /** Minutes per weekday, index 0 = Monday. 0 = not available. */
  availability: number[];
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
  availability: [0, 0, 0, 0, 0, 0, 0],
};

export const onboardingSteps = ["about", "sports", "levels", "goal", "work", "availability"] as const;
export type OnboardingStep = (typeof onboardingSteps)[number];

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
      return true;
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

/** Converts the draft into the shape the server expects. */
export function toOnboardingInput(draft: OnboardingDraft): OnboardingInput {
  return {
    displayName: draft.displayName,
    dateOfBirth: draft.dateOfBirth,
    // Only reached after the "work" step is complete, so it's never null here.
    workPattern: draft.workPattern ?? "fixed",
    sports: draft.sports.map((sport) => ({ sport, level: draft.levels[sport] ?? "beginner" })),
    availability: draft.availability.map((minutes, index) => ({ weekday: index + 1, minutes })),
    goal: toGoalInput(draft),
  };
}

/** Adds the item to the list, or removes it when it's already there. */
export function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}
