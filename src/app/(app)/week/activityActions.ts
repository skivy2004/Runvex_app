"use server";

import { z } from "zod";
import { matchPlannedWorkout, performedOn, readFitFile } from "@/core/activities";
import { isLocale } from "@/core/locale";
import type { Sport } from "@/core/training";
import { refreshAppData } from "@/lib/refreshAppData";
import { createClient } from "@/lib/supabase/server";
import { deleteActivity, insertActivity, linkedPlannedWorkouts, setHealthConsent } from "@/services/activities";
import { trainingName } from "@/services/coachSituation";
import { getCurrentProfile } from "@/services/profile";
import { getPlannedWorkouts, setWorkoutFeedback } from "@/services/workouts";

// Uploading a .FIT file with trainings you did. The file is read on the server and
// then thrown away: only a summary per activity is saved (see core/activities.ts).

/** Bigger than any normal activity file; also under the Server Action limit in next.config.ts. */
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export type UploadedActivity = {
  sport: Sport;
  performedOn: string;
  durationSeconds: number;
  distanceMeters: number | null;
  /** The planned training it was linked to, or null when it's an extra activity. */
  linkedTo: string | null;
  /** True when this activity was uploaded before: nothing changed. */
  duplicate: boolean;
};

export type FitUploadResult =
  | { ok: true; activities: UploadedActivity[]; unsupported: number }
  | { ok: false; error: "notFit" | "noActivity" | "tooBig" | "saveFailed" };

/** Reads one .FIT file, saves its activities and checks off the planned trainings they match. */
export async function uploadFitAction(formData: FormData): Promise<FitUploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "notFit" };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: "tooBig" };

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false, error: "saveFailed" };
  const locale = isLocale(profile.locale) ? profile.locale : "en";

  let read;
  try {
    read = readFitFile(new Uint8Array(await file.arrayBuffer()));
  } catch (error) {
    console.error("Reading a FIT file failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "notFit" };
  }
  if (!read.ok) return read;

  const uploaded: UploadedActivity[] = [];
  try {
    for (const activity of read.activities) {
      const day = performedOn(activity, profile.timezone);
      const planned = await getPlannedWorkouts(supabase, profile.id, day, day);
      const linked = await linkedPlannedWorkouts(supabase, profile.id, planned.map((workout) => workout.id));
      const matchId = matchPlannedWorkout(activity, planned, linked);
      const match = planned.find((workout) => workout.id === matchId) ?? null;

      const { error } = await insertActivity(
        supabase,
        profile.id,
        { ...activity, performedOn: day, plannedWorkoutId: match?.id ?? null },
        profile.health_consent_at !== null,
      );
      // 23505: this activity is already there (uploaded before).
      const duplicate = error?.code === "23505";
      if (error && !duplicate) throw new Error(error.message);

      // You did it, so the planned training is done. A rating you gave stays.
      if (match && !duplicate && match.status === "planned") {
        const done = await setWorkoutFeedback(supabase, profile.id, match.id, { status: "done", rpe: null, note: null });
        if (done.error) throw new Error(done.error.message);
      }
      uploaded.push({
        sport: activity.sport,
        performedOn: day,
        durationSeconds: activity.durationSeconds,
        distanceMeters: activity.distanceMeters,
        linkedTo: match && !duplicate ? trainingName(match, locale) : null,
        duplicate,
      });
    }
  } catch (error) {
    console.error("Saving uploaded activities failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "saveFailed" };
  }

  refreshAppData();
  return { ok: true, activities: uploaded, unsupported: read.unsupported };
}

/** Gives or withdraws consent to store heart rate from uploaded trainings. */
export async function setHealthConsentAction(on: boolean): Promise<{ ok: boolean }> {
  if (typeof on !== "boolean") return { ok: false };
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };
  const { error } = await setHealthConsent(supabase, profile.id, on);
  if (error) {
    console.error("Changing health consent failed:", error.message);
    return { ok: false };
  }
  refreshAppData();
  return { ok: true };
}

/** Removes an uploaded activity, e.g. a wrong file. The training's check-off stays. */
export async function deleteActivityAction(id: string): Promise<{ ok: boolean }> {
  if (!z.uuid().safeParse(id).success) return { ok: false };
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return { ok: false };
  const { error } = await deleteActivity(supabase, profile.id, id);
  if (error) {
    console.error("Deleting an activity failed:", error.message);
    return { ok: false };
  }
  refreshAppData();
  return { ok: true };
}
