import type { Locale } from "@/core/locale";
import type messages from "../messages/en.json";

// Makes translation keys type-safe: t("Home.typo") becomes a TypeScript error.
// English is the source of truth; nl.json must contain the same keys.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
