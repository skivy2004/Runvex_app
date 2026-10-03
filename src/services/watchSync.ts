import "server-only";
import type { Locale } from "@/core/locale";
import { belongsOnWatch, toIntervalsEvent, type TrainingForWatch } from "@/core/watch/intervals";

// Sends trainings to the watch, via intervals.icu (which syncs to Garmin Connect).
// The rest of the app only uses these functions, so later another route (intervals.icu
// OAuth per user, Terra or Garmin directly) can take its place.
//
// For now one intervals.icu account is set in the environment (development):
//   INTERVALS_ATHLETE_ID, INTERVALS_API_KEY

const BASE_URL = "https://intervals.icu/api/v1";
const TIMEOUT_MS = 10_000;

export function isWatchSyncConfigured(): boolean {
  return Boolean(process.env.INTERVALS_API_KEY && process.env.INTERVALS_ATHLETE_ID);
}

async function intervalsRequest(path: string, method: "POST" | "PUT", body: unknown): Promise<boolean> {
  // Basic auth: the username is literally "API_KEY", the password the key itself.
  const credentials = Buffer.from(`API_KEY:${process.env.INTERVALS_API_KEY}`).toString("base64");
  const athleteId = encodeURIComponent(process.env.INTERVALS_ATHLETE_ID ?? "");
  try {
    const response = await fetch(`${BASE_URL}/athlete/${athleteId}${path}`, {
      method,
      headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error("Watch sync failed:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Watch sync failed:", error);
    return false;
  }
}

/** Creates or updates these trainings on the watch (matched by their Runvex id). Swims are skipped. */
export async function sendToWatch(trainings: TrainingForWatch[], locale: Locale): Promise<boolean> {
  const forWatch = trainings.filter(belongsOnWatch);
  if (!isWatchSyncConfigured() || forWatch.length === 0) return true;
  const events = forWatch.map((training) => toIntervalsEvent(training, locale));
  return intervalsRequest("/events/bulk?upsert=true", "POST", events);
}

/** Removes these trainings from the watch. */
export async function removeFromWatch(ids: string[]): Promise<boolean> {
  if (!isWatchSyncConfigured() || ids.length === 0) return true;
  return intervalsRequest(
    "/events/bulk-delete",
    "PUT",
    ids.map((id) => ({ external_id: id })),
  );
}
