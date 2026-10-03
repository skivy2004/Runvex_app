import { z } from "zod";
import { addDays } from "@/core/dates";
import { fittingWorkouts, isHardWorkout, type PlannableSport, type SwimSettings } from "@/core/planner";
import type { ExperienceLevel, Sport } from "@/core/training";
import { estimatedMinutes } from "@/core/workouts/estimate";
import { getWorkout } from "@/core/workouts/library";
import { parseSwimWorkoutId } from "@/core/workouts/swimTraining";
import type { Workout } from "@/core/workouts/types";

// A coach can propose changes to upcoming trainings: swap one for an easier,
// harder or similar workout, move it to another day, or remove it. A proposal is
// only applied when the athlete agrees, and every change is checked here against
// the options we gave the coach, so it can't invent workouts or touch other trainings.

export const MAX_CHANGES = 3;

export const proposalChangeSchema = z.object({
  type: z.enum(["swap", "move", "remove", "recovery_week"]),
  /** The planned training (its id in "upcoming"); empty for "recovery_week". */
  workoutId: z.string(),
  /** swap: the new workout, from that training's options. */
  newWorkoutId: z.string().nullable(),
  /** move: the new date, from "moveDates". recovery_week: the Monday, from "recoveryWeekOptions". */
  newDate: z.string().nullable(),
  /** One sentence for the athlete. */
  reason: z.string(),
});
export type ProposalChange = z.infer<typeof proposalChangeSchema>;

/** How many options per direction a training gets. */
const OPTIONS_PER_DIRECTION = 4;

export type AdjustOptions = { easier: string[]; similar: string[]; harder: string[] };

/** Two block swims with the same warm-up and cool-down that differ in exactly one of technique, endurance or speed. */
function oneBlockApart(a: string, b: string): boolean {
  const x = parseSwimWorkoutId(a);
  const y = parseSwimWorkoutId(b);
  if (!x || !y || x.poolLength !== y.poolLength || x.warmup !== y.warmup || x.cooldown !== y.cooldown) return false;
  return [x.technique !== y.technique, x.main !== y.main, x.speed !== y.speed].filter(Boolean).length === 1;
}

/**
 * The workouts an upcoming training could become, as "id:minutes": easier (lower
 * difficulty), similar (same difficulty) and harder (higher), all fitting the day
 * and the level, closest in length first. Swims change one block at a time.
 */
export function adjustOptions(
  current: Workout,
  level: ExperienceLevel,
  dayMinutes: number,
  swim: SwimSettings,
): AdjustOptions {
  const sport = current.sport as PlannableSport;
  const currentMinutes = estimatedMinutes(current, level) ?? 0;
  const minutes = Math.max(dayMinutes, currentMinutes);
  const settings = current.swim ? { ...swim, poolLength: current.swim.poolLength } : swim;
  const candidates = [...fittingWorkouts(sport, level, minutes, "easy", settings), ...fittingWorkouts(sport, level, minutes, "hard", settings)]
    .filter((candidate) => candidate.workout.id !== current.id)
    .filter((candidate) => !current.swim || oneBlockApart(current.id, candidate.workout.id))
    .sort((a, b) => Math.abs(a.minutes - currentMinutes) - Math.abs(b.minutes - currentMinutes));

  const pick = (keep: (workout: Workout) => boolean) =>
    candidates
      .filter((candidate) => keep(candidate.workout))
      .slice(0, OPTIONS_PER_DIRECTION)
      .map((candidate) => `${candidate.workout.id}:${candidate.minutes}`);
  return {
    easier: pick((workout) => workout.difficulty < current.difficulty),
    similar: pick((workout) => workout.difficulty === current.difficulty),
    harder: pick((workout) => workout.difficulty > current.difficulty),
  };
}

/** An upcoming training as the coach may change it. */
export type ChangeableTraining = {
  id: string;
  date: string;
  sport: Sport;
  /** "id:minutes" of the workouts it may become (empty for your own trainings). */
  options: AdjustOptions;
};

/** The dates a training may move to: from today, two weeks ahead. */
export function moveDates(today: string): string[] {
  return Array.from({ length: 14 }, (_, index) => addDays(today, index));
}

const idOf = (option: string) => option.slice(0, option.lastIndexOf(":"));

/**
 * The changes that are allowed: only upcoming trainings we listed, only to the
 * workouts and dates we offered, at most one change per training and MAX_CHANGES
 * in total. Everything else is dropped.
 */
export function checkChanges(
  changes: ProposalChange[],
  trainings: ChangeableTraining[],
  today: string,
  recoveryWeekOptions: string[] = [],
): ProposalChange[] {
  const dates = new Set(moveDates(today));
  const touched = new Set<string>();
  const valid: ProposalChange[] = [];
  for (const change of changes) {
    if (change.type === "recovery_week") {
      const week = change.newDate;
      if (!week || !recoveryWeekOptions.includes(week) || touched.has(`week:${week}`)) continue;
      touched.add(`week:${week}`);
      valid.push({ ...change, workoutId: "", newWorkoutId: null, reason: change.reason.trim().slice(0, 300) });
      if (valid.length === MAX_CHANGES) break;
      continue;
    }
    const training = trainings.find((item) => item.id === change.workoutId);
    if (!training || touched.has(training.id)) continue;
    const ok =
      change.type === "remove" ||
      (change.type === "move" && change.newDate !== null && dates.has(change.newDate) && change.newDate !== training.date) ||
      (change.type === "swap" &&
        change.newWorkoutId !== null &&
        [...training.options.easier, ...training.options.similar, ...training.options.harder].map(idOf).includes(change.newWorkoutId));
    if (!ok) continue;
    touched.add(training.id);
    valid.push({ ...change, reason: change.reason.trim().slice(0, 300) });
    if (valid.length === MAX_CHANGES) break;
  }
  return valid;
}

/** Whether a change makes the training easier or harder, for the label in the app. */
export function swapDirection(currentTemplateId: string | null, newWorkoutId: string): "easier" | "harder" | "similar" {
  const current = currentTemplateId ? getWorkout(currentTemplateId) : undefined;
  const next = getWorkout(newWorkoutId);
  if (!current || !next) return "similar";
  if (next.difficulty !== current.difficulty) return next.difficulty < current.difficulty ? "easier" : "harder";
  if (isHardWorkout(next) !== isHardWorkout(current)) return isHardWorkout(next) ? "harder" : "easier";
  return "similar";
}
