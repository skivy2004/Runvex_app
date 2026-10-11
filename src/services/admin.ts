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

/* ---------- Agent hub (supabase/migrations/20261011120000_agent_hub.sql) ---------- */

export type AgentMessageKind = "report" | "mail_summary" | "marketing_draft" | "alert" | "chat" | "note";
export type AgentMessageStatus = "new" | "read" | "approved" | "rejected" | "done";

export type AgentMessage = {
  id: number;
  from: string;
  to: string;
  kind: AgentMessageKind;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  thread_id: number | null;
  status: AgentMessageStatus;
  created_at: string;
  emailed: boolean;
};

/** What public.admin_hub() returns. */
export type AgentHub = {
  messages: AgentMessage[];
  agents: { name: string; active: boolean; created_at: string; last_seen_at: string | null }[];
  monthly_ai_budget_usd: number;
  ai_credit_usd: number | null;
  ai_credit_since: string | null;
  ai_credit_spent_usd: number | null;
  email_ready: boolean;
};

/** Agent messages, agents and AI budgets. The database refuses non-admins. */
export async function getAgentHub(supabase: Client) {
  const { data, error } = await supabase.rpc("admin_hub");
  if (error) throw error;
  return data as unknown as AgentHub;
}

export async function setAgentMessageStatus(supabase: Client, id: number, status: AgentMessageStatus) {
  const { error } = await supabase.rpc("admin_set_message_status", { p_id: id, p_status: status });
  if (error) throw error;
}

export async function markAllAgentMessagesRead(supabase: Client) {
  const { error } = await supabase.rpc("admin_mark_all_read");
  if (error) throw error;
}

/** A message from the admin to an agent; returns the new message id. */
export async function postAgentMessage(supabase: Client, toAgent: string, body: string, threadId: number | null) {
  const { data, error } = await supabase.rpc("admin_post_message", {
    p_to_agent: toAgent,
    p_body: body,
    ...(threadId === null ? {} : { p_thread_id: threadId }),
  });
  if (error) throw error;
  return data;
}

/** Makes or replaces an agent's key. The key is returned only this once. */
export async function createAgentKey(supabase: Client, name: string) {
  const { data, error } = await supabase.rpc("admin_create_agent_key", { p_name: name });
  if (error) throw error;
  return data;
}

export async function revokeAgentKey(supabase: Client, name: string) {
  const { error } = await supabase.rpc("admin_revoke_agent_key", { p_name: name });
  if (error) throw error;
}

/** Monthly AI budget and, optionally, a new prepaid credit top-up counted from now. */
export async function setAiBudget(supabase: Client, monthlyBudgetUsd: number, creditTopupUsd: number | null) {
  const { error } = await supabase.rpc("admin_set_ai_budget", {
    p_monthly_budget_usd: monthlyBudgetUsd,
    ...(creditTopupUsd === null ? {} : { p_credit_topup_usd: creditTopupUsd }),
  });
  if (error) throw error;
}
