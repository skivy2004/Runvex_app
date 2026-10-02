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
      {/* pb-32 keeps the last content clear of the tab bar. */}
      <main className="flex flex-1 flex-col pt-6 pb-32">{children}</main>
      <BottomNav />
    </>
  );
}
