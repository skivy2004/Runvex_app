import Link from "next/link";
import { getFormatter } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { gambarino, switzer } from "@/components/landing/fonts";
import { Container, Eyebrow } from "@/components/landing/Section";
import { LandingFooter } from "@/components/landing/Sections";
import type { LegalContent } from "@/content/legal";
import { toFormattableDate } from "@/core/dates";

type LegalPageProps = {
  content: LegalContent;
  /** The date the text last changed, as "YYYY-MM-DD". */
  lastUpdated: string;
};

/**
 * A legal page (privacy statement, terms of use), in the style of the landing
 * page: its fonts, colors and footer, and the sections as an editorial list
 * with hairlines between them (like the features). Public: anyone can read it.
 */
export async function LegalPage({ content, lastUpdated }: LegalPageProps) {
  const format = await getFormatter();

  return (
    <div
      className={`landing ${gambarino.variable} ${switzer.variable} flex min-h-dvh flex-col bg-lp-bg font-body text-lp-chalk`}
    >
      <header className="pt-[env(safe-area-inset-top)]">
        <Container className="flex h-[72px] items-center justify-between gap-6">
          <Link
            href="/"
            className="font-display text-[2rem] leading-none tracking-[-0.05em] text-lp-coral sm:text-[2.5rem]"
          >
            Runvex
          </Link>
          <LanguageSwitcher tone="landing" />
        </Container>
      </header>

      <main className="flex-1 py-16 sm:py-24">
        <Container>
          {/* A narrower column than the landing page: long text reads easier. */}
          <div className="mx-auto flex max-w-[50rem] flex-col gap-12">
            <div className="flex flex-col gap-5">
              <Eyebrow>
                {content.updatedLabel}:{" "}
                {format.dateTime(toFormattableDate(lastUpdated), {
                  dateStyle: "long",
                  timeZone: "UTC",
                })}
              </Eyebrow>
              <h1 className="font-display text-[3rem] leading-[0.98] tracking-[-0.05em] text-lp-coral sm:text-7xl">
                {content.title}
              </h1>
              <p className="text-lg font-medium leading-snug tracking-[-0.02em] text-lp-pink sm:text-xl">
                {content.intro}
              </p>
            </div>

            <div>
              {content.sections.map((section) => (
                <section
                  key={section.heading}
                  className="flex flex-col gap-4 border-t border-lp-line py-8 last:border-b sm:py-10"
                >
                  <h2 className="font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em] text-lp-coral sm:text-[2rem]">
                    {section.heading}
                  </h2>
                  {section.items && (
                    <ul className="flex list-disc flex-col gap-2 pl-5 text-[1.0625rem] leading-[1.5] text-lp-chalk/70 marker:text-lp-coral">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[1.0625rem] leading-[1.5] text-lp-chalk/70"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.processors && (
                    <ul className="flex flex-col">
                      {section.processors.map((processor) => (
                        <li
                          key={processor.name}
                          className="flex flex-col gap-1 border-t border-lp-line/60 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                        >
                          <span className="text-lg font-medium tracking-[-0.02em] text-lp-chalk">
                            {processor.name}
                          </span>
                          <span className="text-base text-lp-chalk/70 sm:text-right">
                            {processor.purpose} · {processor.location}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </div>
        </Container>
      </main>

      <LandingFooter />
    </div>
  );
}
