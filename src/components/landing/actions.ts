"use server";

import { getLocale } from "next-intl/server";
import { isLocale } from "@/core/locale";
import { waitlistSchema } from "@/core/validation/waitlist";
import { createClient } from "@/lib/supabase/server";
import { joinWaitlist } from "@/services/waitlist";

export type WaitlistState =
  | { status: "idle" }
  | { status: "joined" }
  | { status: "error"; error: "invalidEmail" | "generic"; email: string };

export async function joinWaitlistAction(_previous: WaitlistState, formData: FormData): Promise<WaitlistState> {
  // A hidden field people never see. Bots fill in every field: pretend it worked.
  if (formData.get("company")) return { status: "joined" };

  const email = String(formData.get("email") ?? "");
  const parsed = waitlistSchema.safeParse({ email });
  if (!parsed.success) return { status: "error", error: "invalidEmail", email };

  const locale = await getLocale();
  const result = await joinWaitlist(await createClient(), parsed.data.email, isLocale(locale) ? locale : "en");
  if (result === "ok") return { status: "joined" };
  return { status: "error", error: result === "invalid-email" ? "invalidEmail" : "generic", email };
}
