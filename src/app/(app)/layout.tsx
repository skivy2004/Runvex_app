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
      {/* Keeps the last content clear of the tab bar, which is taller on iPhones with a home bar. */}
      <main className="flex flex-1 flex-col pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
