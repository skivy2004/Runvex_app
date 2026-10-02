"use server";

import { redirect } from "next/navigation";
import { missingLongSessions, type DayAvailability } from "@/core/availability";
import { availabilitySchema, profileDetailsSchema } from "@/core/validation/onboarding";
import { createClient } from "@/lib/supabase/server";
import { getAthleteSports } from "@/services/athleteSports";
import { saveWeeklyAvailability } from "@/services/availability";
import { refreshAppData } from "@/lib/refreshAppData";
import { updateProfileDetails } from "@/services/profile";

export type DetailsFormState = { error: "tooYoung" | "invalid" | "saveFailed" | null };

async function getUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims.sub };
}

export async function saveProfileDetails(
  _previous: DetailsFormState,
  formData: FormData,
): Promise<DetailsFormState> {
  // Validate again on the server: anyone can call a Server Action with any data.
  const parsed = profileDetailsSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    dateOfBirth: formData.get("dateOfBirth") ?? "",
  });
  if (!parsed.success) {
    const tooYoung = parsed.error.issues.some((issue) => issue.message === "tooYoung");
    return { error: tooYoung ? "tooYoung" : "invalid" };
  }

  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "saveFailed" };

  const { error } = await updateProfileDetails(supabase, userId, parsed.data);
  if (error) {
    console.error("Saving profile details failed:", error.message);
    return { error: "saveFailed" };
  }

  refreshAppData();
  // redirect() works by throwing, so it must stay outside try/catch.
  redirect("/profile");
}

/** Saves the usual week: time and sports per weekday, index 0 = Monday. */
export async function saveAvailability(week: DayAvailability[]): Promise<{ ok: boolean }> {
  const parsed = availabilitySchema.safeParse(
    week.map((day, index) => ({ weekday: index + 1, ...day })),
  );
  if (!parsed.success) return { ok: false };

  const { supabase, userId } = await getUserId();
  if (!userId) return { ok: false };

  // Same rule as in the intake: runners keep a long run day, cyclists a long ride day.
  const userSports = (await getAthleteSports(supabase, userId)).map((item) => item.sport);
  if (missingLongSessions(week, userSports).length > 0) return { ok: false };

  const { error } = await saveWeeklyAvailability(supabase, userId, parsed.data);
  if (error) {
    console.error("Saving availability failed:", error.message);
    return { ok: false };
  }

  refreshAppData();
  redirect("/profile");
}
