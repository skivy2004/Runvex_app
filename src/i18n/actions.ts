"use server";

import { isLocale } from "@/core/locale";
import { writeLocaleCookie } from "./cookie";

/**
 * Stores the chosen language in a cookie. Setting a cookie in a Server Action
 * makes Next.js re-render the current page, so the new language shows at once.
 */
export async function setLocale(locale: string) {
  // Server Actions can be called by anyone with any value: always validate.
  if (!isLocale(locale)) return;

  await writeLocaleCookie(locale);
}
