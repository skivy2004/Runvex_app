"use server";

import { isLocale } from "@/core/locale";
import { createClient } from "@/lib/supabase/server";
import { writeLocaleCookie } from "./cookie";

/**
 * Stores the chosen language in a cookie, and in the profile when logged in
 * (the profile's language wins at the next login). Setting a cookie in a
 * Server Action makes Next.js re-render the page, so the new language shows at once.
 */
export async function setLocale(locale: string) {
  // Server Actions can be called by anyone with any value: always validate.
  if (!isLocale(locale)) return;

  await writeLocaleCookie(locale);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (userId) {
    await supabase.from("profiles").update({ locale }).eq("id", userId);
  }
}
