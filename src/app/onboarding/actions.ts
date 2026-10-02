"use server";

import { onboardingSchema, type OnboardingInput } from "@/core/validation/onboarding";
import { createClient } from "@/lib/supabase/server";
import { refreshAppData } from "@/lib/refreshAppData";
import { saveOnboarding } from "@/services/onboarding";

export async function completeOnboarding(input: OnboardingInput): Promise<{ ok: boolean }> {
  // Validate again on the server: anyone can call a Server Action with any data.
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = await saveOnboarding(supabase, parsed.data);
  if (error) {
    console.error("Saving onboarding failed:", error.message);
    return { ok: false };
  }

  refreshAppData();
  return { ok: true };
}
