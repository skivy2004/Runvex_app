import { Decoder, Stream } from "@garmin/fitsdk";
import { todayInTimeZone } from "./dates";
import type { Sport } from "./training";

// Trainings you actually did, from a .FIT file (exported from Garmin Connect or
// another watch app). Only a summary per activity is taken: no GPS track, no
// per-second data. The Garmin FIT SDK may only run on the server (its license
// doesn't allow handing it to others), so this module is used by Server Actions only.

/** One activity as read from the file. A triathlon file holds one per sport. */
export type ActivitySummary = {
  sport: Sport;
  startedAt: Date;
  durationSeconds: number;
  distanceMeters: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  ascentMeters: number | null;
};

export type FitReadResult =
  | { ok: true; activities: ActivitySummary[]; unsupported: number }
  | { ok: false; error: "notFit" | "noActivity" };

/** The app's sport for a FIT sport, or null for sports Runvex doesn't track (walking, skiing…). */
export function sportFromFit(sport: unknown, subSport: unknown): Sport | null {
  if (sport === "running") return "running";
  if (sport === "cycling" || sport === "eBiking") return "cycling";
  if (sport === "swimming") return "swimming";
  if (sport === "training" && subSport === "strengthTraining") return "strength";
  return null;
}

/** A positive whole number, or null for missing or nonsense values. */
function rounded(value: unknown, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= max ? Math.round(value) : null;
}

/** Reads the activities (sessions) from a .FIT file. */
export function readFitFile(bytes: Uint8Array): FitReadResult {
  const stream = Stream.fromByteArray(Array.from(bytes));
  if (!Decoder.isFIT(stream)) return { ok: false, error: "notFit" };
  const { messages } = new Decoder(stream).read({ includeUnknownData: false, decodeMemoGlobs: false });

  const sessions = messages.sessionMesgs ?? [];
  const activities: ActivitySummary[] = [];
  let unsupported = 0;
  for (const session of sessions) {
    // Transitions in a triathlon file are sessions too; they aren't trainings.
    if (session.sport === "transition") continue;
    const sport = sportFromFit(session.sport, session.subSport);
    const startedAt = session.startTime instanceof Date ? session.startTime : null;
    // Moving time when the watch has it (pauses don't count), otherwise the total.
    const durationSeconds = rounded(session.totalTimerTime, 86_400) ?? rounded(session.totalElapsedTime, 86_400);
    if (!sport || !startedAt || durationSeconds === null || durationSeconds < 60) {
      unsupported++;
      continue;
    }
    activities.push({
      sport,
      startedAt,
      durationSeconds,
      distanceMeters: rounded(session.totalDistance, 1_000_000),
      avgHeartRate: rounded(session.avgHeartRate, 250),
      maxHeartRate: rounded(session.maxHeartRate, 250),
      avgPower: rounded(session.avgPower, 3000),
      ascentMeters: rounded(session.totalAscent, 20_000),
    });
  }
  if (activities.length === 0 && unsupported === 0) return { ok: false, error: "noActivity" };
  return { ok: true, activities, unsupported };
}

/** The day the activity was done, in the athlete's own time zone. */
export function performedOn(activity: Pick<ActivitySummary, "startedAt">, timeZone: string): string {
  return todayInTimeZone(timeZone, activity.startedAt);
}

type PlannedCandidate = { id: string; sport: Sport; status: string; duration_minutes: number };

/**
 * Which planned training of that day this activity was: same sport, not skipped,
 * not already linked to another upload. Open ones first, then the closest in length.
 */
export function matchPlannedWorkout(
  activity: Pick<ActivitySummary, "sport" | "durationSeconds">,
  plannedThatDay: PlannedCandidate[],
  alreadyLinked: Set<string>,
): string | null {
  const minutes = activity.durationSeconds / 60;
  const candidates = plannedThatDay
    .filter((workout) => workout.sport === activity.sport && workout.status !== "skipped" && !alreadyLinked.has(workout.id))
    .sort(
      (a, b) =>
        Number(a.status !== "planned") - Number(b.status !== "planned") ||
        Math.abs(a.duration_minutes - minutes) - Math.abs(b.duration_minutes - minutes),
    );
  return candidates[0]?.id ?? null;
}
