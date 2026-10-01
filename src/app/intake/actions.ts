"use server";

import { trainingProfileSchema, type TrainingProfileInput } from "@/core/validation/onboarding";
import { createClient } from "@/lib/supabase/server";
import { saveTrainingProfile } from "@/services/onboarding";

/** Saves the answers when the intake is done again (without name and date of birth). */
export async function saveIntakeAgain(input: TrainingProfileInput): Promise<{ ok: boolean }> {
  // Validate again on the server: anyone can call a Server Action with any data.
  const parsed = trainingProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = await saveTrainingProfile(supabase, parsed.data);
  if (error) {
    console.error("Saving the intake again failed:", error.message);
    return { ok: false };
  }

  return { ok: true };
}
