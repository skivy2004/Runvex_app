import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { PhoneColumn } from "@/components/PhoneColumn";
import { getRequestProfile } from "@/lib/currentUser";

// Shared frame for all pages with the tab bar: Home, Week, Goal and Profile.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getRequestProfile();
  // New users first fill in the intake.
  if (profile && !profile.onboarding_completed_at) redirect("/onboarding");
  // Logged out, only "/" gets here (src/proxy.ts): the landing page, full width, without the tab bar.
  if (!profile) return children;

  return (
    <PhoneColumn>
      {/* The soft French Blue and coral glow behind every page. */}
      <div aria-hidden className="app-glow" />
      {/* Keeps the last content clear of the floating tab bar (taller on iPhones with a home bar). */}
      <main className="flex flex-1 flex-col pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      {/*
        Scroll edges: instead of content being cut off hard, it fades out under the
        status bar (in the installed app) and behind the floating tab bar.
      */}
      <div aria-hidden className="scroll-edge-top" />
      <div aria-hidden className="scroll-edge-bottom" />
      <BottomNav />
    </PhoneColumn>
  );
}
