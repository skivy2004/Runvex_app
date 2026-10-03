import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { LAST_UPDATED, privacyContent } from "@/content/privacy";
import { isLocale } from "@/core/locale";
import { toFormattableDate } from "@/core/dates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${privacyContent[isLocale(locale) ? locale : "en"].title} · Runvex` };
}

/** The privacy statement. Public: anyone can read it, logged in or not. */
export default async function PrivacyPage() {
  const locale = await getLocale();
  const format = await getFormatter();
  const content = privacyContent[isLocale(locale) ? locale : "en"];

  return (
    <main className="flex flex-col gap-6 py-6 pb-12">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Runvex">
          <Logo className="text-lg" />
        </Link>
        <LanguageSwitcher />
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{content.title}</h1>
        <p className="text-sm text-muted">
          {content.updatedLabel}:{" "}
          {format.dateTime(toFormattableDate(LAST_UPDATED), { dateStyle: "long", timeZone: "UTC" })}
        </p>
        <p className="text-muted">{content.intro}</p>
      </div>

      {content.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3 rounded-[1.75rem] border border-white/[0.08] bg-surface/70 backdrop-blur-xl p-5">
          <h2 className="text-lg font-semibold">{section.heading}</h2>
          {section.items && (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm marker:text-accent">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-sm text-muted">
              {paragraph}
            </p>
          ))}
          {section.processors && (
            <ul className="flex flex-col gap-2">
              {section.processors.map((processor) => (
                <li key={processor.name} className="flex flex-col rounded-2xl bg-surface-raised px-4 py-3 text-sm">
                  <span className="font-semibold">{processor.name}</span>
                  <span className="text-muted">
                    {processor.purpose} · {processor.location}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
