import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

/** What public.admin_overview() returns (supabase/migrations/20261010120000_admin.sql). */
export type AdminOverview = {
  users_total: number;
  users_onboarded: number;
  signups_7d: number;
  active_users_7d: number;
  trainings_done_7d: number;
  fit_uploads_7d: number;
  coach_messages_7d: number;
  waitlist_total: number;
  waitlist_7d: number;
  waitlist_nl: number;
  waitlist_recent: { email: string; locale: string; created_at: string }[];
  daily: { day: string; waitlist: number; signups: number }[];
  ai_cost_today: number;
  ai_cost_month: number;
  ai_calls_month: number;
  ai_by_purpose: { purpose: string; calls: number; cost: number }[];
  ai_users_over_80pct: number;
};

/** True when the logged-in user is in public.admins. */
export async function isAdmin(supabase: Client) {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data === true;
}

/** All numbers for the admin dashboard. The database refuses non-admins. */
export async function getAdminOverview(supabase: Client) {
  const { data, error } = await supabase.rpc("admin_overview");
  if (error) throw error;
  return data as unknown as AdminOverview;
}
