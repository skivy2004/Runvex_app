import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminDashboard } from "@/components/ui/dashboard-with-collapsible-sidebar";
import { getRequestClient } from "@/lib/currentUser";
import { getAdminOverview, isAdmin } from "@/services/admin";

export const metadata: Metadata = {
  title: "Admin · Runvex",
  robots: { index: false, follow: false },
};

// Only for admins (public.admins). Everyone else gets a plain 404, so the page
// doesn't even reveal that it exists. Logged-out visitors are already sent to
// /login by src/proxy.ts.
export default async function AdminPage() {
  const supabase = await getRequestClient();
  if (!(await isAdmin(supabase))) notFound();

  const overview = await getAdminOverview(supabase);
  return <AdminDashboard overview={overview} />;
}
