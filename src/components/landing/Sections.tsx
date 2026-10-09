import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PRIVACY_CONTACT } from "@/content/privacy";
import appMockup from "../../../public/landing/app-mockup.jpg";
import founder from "../../../public/landing/founder.jpg";
import { Band, Container, Eyebrow, Heading } from "./Section";
import { WaitlistForm } from "./WaitlistForm";

// The landing page sections under the hero, top to bottom, as designed in Figma.
// Text lives in messages/*.json under "Landing"; every claim must be true for the app today.
// "reveal" / "reveal-zoom" make blocks come in on scroll (globals.css).

/** Cards next to each other in a row come in one after the other (0, 1, 2). */
const stagger = (position: number) => ({ "--i": position }) as CSSProperties;

export function ProblemSection() {
  const t = useTranslations("Landing.problem");
  return (
    <Band>
      <Container className="flex flex-col gap-8">
        <div className="reveal flex flex-col gap-5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading className="text-lp-chalk lg:text-[5rem]">{t("title")}</Heading>
        </div>
        <p className="reveal max-w-[47.5rem] text-lg leading-[1.5] text-lp-pink sm:text-2xl">{t("body")}</p>
      </Container>
    </Band>
  );
}

const STEPS = ["one", "two", "three"] as const;

export function StepsSection() {
  const t = useTranslations("Landing.steps");
  return (
    <Band id="how" className="bg-lp-bg-deep">
      <Container className="flex flex-col gap-12 sm:gap-14">
        <div className="reveal flex flex-col gap-5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading>{t("title")}</Heading>
        </div>
        {/* A timeline instead of cards: one thin line through the steps.
            Vertical on a phone (line on the left), horizontal from md, where
            the columns have no gap and the line runs through the step's right
            padding, stopping just short of the next step. */}
        <ol className="stagger-md grid md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="reveal group relative pb-14 pl-10 last:pb-0 md:pb-0 md:pl-0 md:pr-12" style={stagger(index)}>
              <div aria-hidden className="absolute inset-y-0 left-0 flex flex-col items-center md:static md:-mr-9 md:mb-10 md:flex-row">
                <span className="mt-4 w-px flex-1 bg-lp-line group-last:hidden md:mt-0 md:h-px md:w-auto md:group-last:block md:group-last:bg-transparent md:group-last:bg-gradient-to-r md:group-last:from-lp-line md:group-last:to-transparent" />
              </div>
              <span aria-hidden className="font-display text-6xl leading-none text-lp-coral lg:text-[5.5rem]">
                {index + 1}
              </span>
              <h3 className="mt-5 font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em] text-lp-chalk sm:text-[2rem]">{t(`${step}.title`)}</h3>
              <p className="mt-3 max-w-[22rem] text-lg leading-[1.5] text-lp-chalk/70">{t(`${step}.body`)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Band>
  );
}

const FEATURES = ["coach", "race", "drag", "sports", "watch", "privacy"] as const;

export function FeaturesSection() {
  const t = useTranslations("Landing.features");
  return (
    <Band id="features">
      <Container className="flex flex-col gap-12 sm:gap-14">
        <div className="reveal flex flex-col gap-5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading>{t("title")}</Heading>
        </div>
        {/* An editorial list instead of cards: hairlines between the rows and
            the title in Gambarino. Two columns from md. */}
        <ul className="stagger-md grid md:grid-cols-2 md:gap-x-16 lg:gap-x-24">
          {FEATURES.map((feature, index) => (
            <li
              key={feature}
              className="reveal flex flex-col gap-3 border-t border-lp-line py-8 last:border-b sm:py-10 md:[&:nth-last-child(2)]:border-b"
              style={stagger(index % 2)}
            >
              <h3 className="font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em] text-lp-coral sm:text-[2rem]">
                {t(`${feature}.title`)}
              </h3>
              <p className="max-w-[28rem] text-[1.0625rem] leading-[1.5] text-lp-chalk/70">{t(`${feature}.body`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Band>
  );
}

export function AppSection() {
  const t = useTranslations("Landing.app");
  return (
    <Band className="bg-lp-bg-deep">
      <Container className="grid items-center gap-12 lg:grid-cols-[30rem_1fr] lg:gap-20">
        <div className="flex flex-col gap-7">
          <div className="reveal flex flex-col gap-5">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Heading>{t("title")}</Heading>
          </div>
          <p className="reveal text-lg leading-[1.5] text-lp-pink sm:text-xl">{t("body")}</p>
        </div>
        <Image
          src={appMockup}
          alt={t("imageAlt")}
          sizes="(min-width: 1200px) 640px, (min-width: 1024px) 50vw, 100vw"
          placeholder="blur"
          className="reveal-zoom h-auto w-full rounded-3xl"
        />
      </Container>
    </Band>
  );
}

export function StorySection() {
  const t = useTranslations("Landing.story");
  return (
    <Band>
      <Container>
        <figure className="reveal mx-auto flex max-w-[57.5rem] flex-col items-center gap-9 text-center">
          <Image src={founder} alt={t("photoAlt")} sizes="112px" placeholder="blur" className="size-28 rounded-full object-cover" />
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <blockquote className="font-display text-3xl leading-[1.15] tracking-[-0.01em] text-lp-chalk sm:text-5xl lg:text-[3.25rem]">
            “{t("quote")}”
          </blockquote>
          <figcaption className="text-lg font-medium text-lp-pink">{t("author")}</figcaption>
        </figure>
      </Container>
    </Band>
  );
}

export function WaitlistSection() {
  const t = useTranslations("Landing.cta");
  return (
    <Band id="waitlist" className="bg-lp-coral lg:py-[7.5rem]">
      <Container className="flex flex-col items-center gap-8 text-center">
        <div className="reveal flex flex-col items-center gap-5">
          <Eyebrow className="text-lp-bg">{t("eyebrow")}</Eyebrow>
          <Heading className="text-lp-bg sm:text-7xl lg:text-[5.5rem]">{t("title")}</Heading>
        </div>
        <p className="reveal max-w-[40rem] text-lg leading-[1.5] text-lp-bg sm:text-[1.375rem]">{t("body")}</p>
        <div className="reveal flex w-full flex-col items-center gap-4">
          <WaitlistForm tone="dark" />
          <p className="text-[0.9375rem] font-medium text-lp-bg/75">{t("note")}</p>
        </div>
      </Container>
    </Band>
  );
}

const QUESTIONS = ["launch", "price", "watches", "data", "goal", "missed"] as const;

export function FaqSection() {
  const t = useTranslations("Landing.faq");
  return (
    <Band id="faq">
      <Container className="flex flex-col items-center gap-12">
        <div className="reveal flex flex-col items-center gap-5 text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading>{t("title")}</Heading>
        </div>
        <div className="w-full max-w-[60rem]">
          {QUESTIONS.map((question) => (
            <details key={question} className="lp-faq reveal group border-b border-lp-line">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 [&::-webkit-details-marker]:hidden">
                <span className="text-lg font-medium tracking-[-0.02em] text-lp-chalk sm:text-[1.375rem]">{t(`${question}.q`)}</span>
                <span aria-hidden className="font-display text-4xl leading-none text-lp-coral transition-transform duration-300 ease-in-out group-open:rotate-45 motion-reduce:transition-none">
                  +
                </span>
              </summary>
              <p className="-mt-3 max-w-[57rem] pb-7 text-base leading-[1.5] text-lp-chalk/70 sm:text-lg">{t(`${question}.a`)}</p>
            </details>
          ))}
        </div>
      </Container>
    </Band>
  );
}

export function LandingFooter() {
  const t = useTranslations("Landing.footer");
  const link = "text-base text-lp-chalk/70 transition-colors hover:text-lp-chalk";
  return (
    <footer className="bg-lp-footer py-14">
      <Container className="flex flex-wrap items-center gap-x-10 gap-y-6">
        <span className="font-display text-4xl leading-none tracking-[-0.05em] text-lp-coral">Runvex</span>
        <div className="hidden flex-1 sm:block" />
        <Link href="/privacy" className={link}>
          {t("privacy")}
        </Link>
        <a href={`mailto:${PRIVACY_CONTACT.email}`} className={link}>
          {t("contact")}
        </a>
        <Link href="/login" className={link}>
          {t("login")}
        </Link>
        <LanguageSwitcher />
        <span className="text-base text-lp-chalk/45">{t("rights", { year: new Date().getFullYear() })}</span>
      </Container>
    </footer>
  );
}
