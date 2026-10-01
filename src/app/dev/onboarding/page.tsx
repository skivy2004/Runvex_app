// Development-only preview of the whole intake, without logging in.
// "Finish" fails here on purpose: saving requires a logged-in user.
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPreviewPage() {
  return <OnboardingWizard />;
}
