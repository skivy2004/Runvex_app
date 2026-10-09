import type { Locale } from "@/core/locale";
import type { AppSupabaseClient } from "./types";

/**
 * Puts an email address on the waitlist. Also "succeeds" for an address that
 * is already on it, so nobody can find out who signed up.
 */
export async function joinWaitlist(
  supabase: AppSupabaseClient,
  email: string,
  locale: Locale,
): Promise<"ok" | "invalid-email" | "failed"> {
  const { error } = await supabase.rpc("join_waitlist", { p_email: email, p_locale: locale });
  if (!error) return "ok";
  if (error.message.includes("invalid_email")) return "invalid-email";
  console.error("Joining the waitlist failed:", error.message);
  return "failed";
}
