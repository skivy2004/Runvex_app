import type { Locale } from "@/core/locale";
import type { Sport } from "@/core/training";
import { getWorkout } from "@/core/workouts/library";
import type { WorkoutStep, Zone } from "@/core/workouts/types";

// Turns a Runvex training into a planned workout for intervals.icu, which sends it
// on to the watch (Garmin). The steps are written in the intervals.icu workout text
// format, e.g. "- 10m 60-70% HR". Pure logic, so it's easy to test.

/** Our run and ride zones are percentages of max heart rate (see the workout files). */
const heartRateTargets: Record<Zone, string> = {
  1: "50-60% HR",
  2: "60-70% HR",
  3: "70-80% HR",
  4: "80-90% HR",
  5: "90-100% HR",
};

const activityTypes: Record<Sport, string> = {
  running: "Run",
  cycling: "Ride",
  swimming: "Swim",
  strength: "WeightTraining",
};

/** Step cues on the watch, in the user's language. */
const cues: Record<Locale, { walk: string }> = {
  en: { walk: "Walk" },
  nl: { walk: "Wandelen" },
};

/** The training as it's stored in Runvex. */
export type TrainingForWatch = {
  id: string;
  scheduled_on: string;
  sport: Sport;
  title: string;
  duration_minutes: number;
  template_id: string | null;
};

/** A planned workout in the shape the intervals.icu API expects. */
export type IntervalsEvent = {
  /** Our own id, so updates and deletes find the same workout again. */
  external_id: string;
  category: "WORKOUT";
  start_date_local: string;
  type: string;
  name: string;
  description: string;
  moving_time: number;
};

function target(sport: Sport, zone: Zone): string {
  // Heart rate in the pool doesn't work well; swims use the swim pace zones.
  return sport === "swimming" ? `Z${zone} Pace` : heartRateTargets[zone];
}

function stepLines(steps: WorkoutStep[], sport: Sport, locale: Locale): string[] {
  const lines: string[] = [];
  for (const step of steps) {
    if (step.type === "repeat") {
      // A repeat is "4x" followed by its steps, with an empty line around it.
      lines.push("", `${step.times}x`, ...stepLines(step.steps, sport, locale), "");
      continue;
    }
    // Text before the length becomes the cue on the watch, e.g. "Walk" or "Surge".
    const cue = step.isWalking ? cues[locale].walk : (step.label?.[locale] ?? "");
    const length =
      step.durationMinutes !== null ? `${step.durationMinutes}m` : `${step.distanceMeters ?? 0}mtr`;
    const cueText = cue ? `${cue.charAt(0).toUpperCase()}${cue.slice(1)} ` : "";
    lines.push(`- ${cueText}${length} ${target(sport, step.zone)}`);
    // Rest after a swim step: a standing break.
    if (step.restSeconds !== null) lines.push(`- ${step.restSeconds}s 0% Pace`);
  }
  return lines;
}

/** The workout text: warm-up and cool-down get their own section, so the watch shows them as such. */
export function workoutText(steps: WorkoutStep[], sport: Sport, locale: Locale): string {
  const lines: string[] = [];
  for (const step of steps) {
    if (step.type !== "repeat" && (step.type === "warmup" || step.type === "cooldown")) {
      lines.push("", step.type === "warmup" ? "Warmup" : "Cooldown", ...stepLines([step], sport, locale), "");
    } else {
      lines.push(...stepLines([step], sport, locale));
    }
  }
  // Collapse double empty lines and trim, so the text stays tidy.
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function toIntervalsEvent(training: TrainingForWatch, locale: Locale): IntervalsEvent {
  const template = training.template_id ? getWorkout(training.template_id) : undefined;
  return {
    external_id: training.id,
    category: "WORKOUT",
    start_date_local: `${training.scheduled_on}T00:00:00`,
    type: activityTypes[training.sport],
    name: template ? template.name[locale] : training.title,
    // Your own trainings (e.g. strength) have no steps: just the name and the duration.
    description: template ? workoutText(template.steps, template.sport, locale) : "",
    moving_time: training.duration_minutes * 60,
  };
}
