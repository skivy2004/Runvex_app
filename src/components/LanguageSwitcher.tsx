"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { locales } from "@/core/locale";
import { setLocale } from "@/i18n/actions";

/** "app" matches the app's colors; "landing" the landing page (and the legal pages). */
const TONES = {
  app: {
    group: "rounded-full border border-white/10 bg-surface/70 p-1 text-xs font-bold backdrop-blur-xl",
    button: "rounded-full px-3 py-1.5",
    active: "bg-accent text-accent-foreground",
    inactive: "text-muted hover:text-foreground",
  },
  landing: {
    // The thin pink outline and rounded corners of the waitlist field.
    group: "rounded-[15px] border border-lp-pink/60 bg-white/[0.04] p-1 text-sm font-medium tracking-[0.06em]",
    button: "rounded-[11px] px-3 py-1.5",
    active: "bg-lp-coral text-lp-bg",
    inactive: "text-lp-pink hover:text-lp-chalk",
  },
};

export function LanguageSwitcher({ tone = "app" }: { tone?: keyof typeof TONES }) {
  const t = useTranslations("LanguageSwitcher");
  const currentLocale = useLocale();
  // isPending is true while the server re-renders the page in the new language.
  const [isPending, startTransition] = useTransition();
  const style = TONES[tone];

  return (
    <div role="group" aria-label={t("label")} className={`flex ${style.group} ${isPending ? "opacity-60" : ""}`}>
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={isActive}
            disabled={isPending}
            onClick={() => startTransition(() => setLocale(locale))}
            className={`${style.button} uppercase transition ${isActive ? style.active : style.inactive}`}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
