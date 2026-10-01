import { redirect } from "next/navigation";
import { draftFromTrainingProfile } from "@/components/onboarding/draft";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { todayInTimeZone } from "@/core/dates";
import { createClient } from "@/lib/supabase/server";
import { getAthleteSports } from "@/services/athleteSports";
import { getWeeklyAvailability } from "@/services/availability";
import { getCurrentGoal } from "@/services/goals";
import { getCurrentProfile } from "@/services/profile";

// Redo the intake, filled in with the current answers. No tab bar here, like the first intake.
export default async function IntakeAgainPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return null;
  // Someone who never did the intake does the full first version instead.
  if (!profile.onboarding_completed_at) redirect("/onboarding");

  const [sports, availability, goal] = await Promise.all([
    getAthleteSports(supabase, profile.id),
    getWeeklyAvailability(supabase, profile.id),
    getCurrentGoal(supabase, profile.id, todayInTimeZone(profile.timezone)),
  ]);

  const startDraft = draftFromTrainingProfile({
    sports,
    workPattern: profile.work_pattern,
    availability,
    goal,
  });

  return <OnboardingWizard mode="redo" startDraft={startDraft} />;
}
