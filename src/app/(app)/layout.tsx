import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getRequestProfile } from "@/lib/currentUser";

// Shared frame for all pages with the tab bar: Home, Week, Goal and Profile.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getRequestProfile();
  // New users first fill in the intake.
  if (profile && !profile.onboarding_completed_at) redirect("/onboarding");

  return (
    <>
      {/* The soft French Blue and coral glow behind every page. */}
      <div aria-hidden className="app-glow" />
      {/* Keeps the last content clear of the floating tab bar (taller on iPhones with a home bar). */}
      <main className="flex flex-1 flex-col pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
