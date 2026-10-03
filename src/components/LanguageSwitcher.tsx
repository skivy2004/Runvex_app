"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { locales } from "@/core/locale";
import { setLocale } from "@/i18n/actions";

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const currentLocale = useLocale();
  // isPending is true while the server re-renders the page in the new language.
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`flex rounded-full border border-white/10 bg-surface/70 p-1 text-xs font-bold backdrop-blur-xl ${isPending ? "opacity-60" : ""}`}
    >
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => startTransition(() => setLocale(locale))}
            className={`rounded-full px-3 py-1.5 uppercase transition ${
              isActive ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
