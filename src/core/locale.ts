// Supported languages. Framework-free so a future mobile app can reuse it.

export const locales = ["en", "nl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Picks the first supported language from a browser's Accept-Language header,
 * e.g. "nl-NL,nl;q=0.9,en;q=0.8" -> "nl". Browsers list languages in order of
 * preference, so the first match wins.
 */
export function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;

  for (const part of header.split(",")) {
    const language = part.split(";")[0].trim().split("-")[0].toLowerCase();
    if (isLocale(language)) return language;
  }
  return defaultLocale;
}
