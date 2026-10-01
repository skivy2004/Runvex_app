import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isLocale, pickLocaleFromAcceptLanguage, type Locale } from "@/core/locale";
import { LOCALE_COOKIE } from "./constants";

// next-intl calls this for every request to decide the language and load its texts.
export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

async function resolveLocale(): Promise<Locale> {
  // 1. A language the user picked earlier.
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  // 2. Otherwise the browser's language, falling back to English.
  return pickLocaleFromAcceptLanguage((await headers()).get("accept-language"));
}
