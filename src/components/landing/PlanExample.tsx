import { useTranslations } from "next-intl";
import { Band, Container, Eyebrow, Heading } from "./Section";

const DAYS = ["thursday", "friday", "saturday"] as const;

/** An illustrative proposal, rather than a live or automatically applied plan. */
export function PlanExample() {
  const t = useTranslations("Landing.example");

  return (
    <Band className="bg-lp-bg-deep">
      <Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="flex flex-col gap-5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading className="text-lp-chalk lg:text-[3.75rem]">{t("title")}</Heading>
          <p className="max-w-[30rem] text-lg leading-relaxed text-lp-pink">{t("body")}</p>
          <a href="#waitlist" className="mt-2 w-fit text-base font-medium text-lp-coral underline underline-offset-4 hover:text-lp-chalk focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lp-coral">
            {t("cta")}
          </a>
        </div>
        <figure className="min-w-0 rounded-3xl border border-lp-line bg-lp-bg p-5 sm:p-8">
          <figcaption className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-lg font-medium text-lp-chalk">{t("week")}</span>
            <span className="rounded-full border border-lp-line px-3 py-1 text-sm text-lp-pink">{t("label")}</span>
          </figcaption>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {(["before", "after"] as const).map((version) => (
              <section key={version} aria-label={t(version)} className="min-w-0">
                <h3 className={`mb-4 text-sm font-medium ${version === "after" ? "text-lp-coral" : "text-lp-pink"}`}>{t(version)}</h3>
                <ul className="flex flex-col gap-3">
                  {DAYS.map((day) => (
                    <li key={day} className={`min-h-28 rounded-xl border p-3 sm:p-4 ${version === "after" ? "border-lp-coral/40 bg-lp-coral/5" : "border-lp-line"}`}>
                      <p className="mb-2 text-sm text-lp-pink">{t(`days.${day}`)}</p>
                      <p className="text-base font-medium leading-snug text-lp-chalk">{t(`${version}Plan.${day}`)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="mt-6 border-t border-lp-line pt-5">
            <p className="mb-2 text-sm font-medium text-lp-coral">{t("coach")}</p>
            <p className="text-base leading-relaxed text-lp-chalk">{t("proposal")}</p>
            <p className="mt-3 text-sm leading-relaxed text-lp-pink">{t("approval")}</p>
          </div>
        </figure>
      </Container>
    </Band>
  );
}
