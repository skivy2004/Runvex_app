import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profile";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile(await createClient());
  // The intake can only be done once.
  if (profile?.onboarding_completed_at) redirect("/");

  return <OnboardingWizard />;
}
