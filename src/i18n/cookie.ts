import { cookies } from "next/headers";
import type { Locale } from "@/core/locale";
import { LOCALE_COOKIE } from "./constants";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Stores the language choice. Only callable from Server Actions or Route Handlers. */
export async function writeLocaleCookie(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: "lax",
  });
}
