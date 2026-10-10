import type { Locale } from "@/core/locale";
import type { AppSupabaseClient } from "./types";

/**
 * Puts an email address on the waitlist. Also "succeeds" for an address that
 * is already on it, so nobody can find out who signed up.
 */
export async function joinWaitlist(
  supabase: AppSupabaseClient,
  signup: { email: string; locale: Locale; source?: string; promoCode?: string; news: boolean },
): Promise<"ok" | "invalid-email" | "failed"> {
  const { error } = await supabase.rpc("join_waitlist", {
    p_email: signup.email,
    p_locale: signup.locale,
    p_source: signup.source,
    p_promo_code: signup.promoCode,
    p_news: signup.news,
  });
  if (!error) return "ok";
  if (error.message.includes("invalid_email")) return "invalid-email";
  console.error("Joining the waitlist failed:", error.message);
  return "failed";
}
