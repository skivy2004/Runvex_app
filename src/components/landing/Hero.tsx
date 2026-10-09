import Image from "next/image";
import { useTranslations } from "next-intl";
import heroRunner from "../../../public/landing/hero-runner.jpg";
import { Container } from "./Section";
import { WaitlistForm } from "./WaitlistForm";

/** Time between two headline words coming in. */
const WORD_STAGGER_MS = 70;

/** The first screen: a runner in motion blur, the promise, and the waitlist. */
export function Hero() {
  const t = useTranslations("Landing.hero");
  const words = t("title").split(" ");
  // The text and the form follow once the last word is on its way.
  const afterWords = words.length * WORD_STAGGER_MS;

  return (
    <section id="top" className="relative isolate flex min-h-[100svh] items-end overflow-hidden bg-lp-bg pt-32 pb-20 sm:pb-28">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={heroRunner}
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          className="lp-photo-in object-cover object-[55%_center] opacity-40"
        />
        {/* The photo fades into the section below instead of ending on a hard line. */}
        <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-b from-transparent to-lp-bg" />
      </div>

      <Container className="flex flex-col gap-6">
        <h1 className="max-w-[48rem] font-display text-[3.5rem] leading-[0.98] tracking-[-0.05em] text-lp-coral sm:text-7xl lg:text-[6rem]">
          {words.map((word, index) => (
            <span key={index}>
              <span className="lp-rise inline-block" style={{ animationDelay: `${150 + index * WORD_STAGGER_MS}ms` }}>
                {word}
              </span>{" "}
            </span>
          ))}
        </h1>
        <p
          className="lp-rise max-w-[40rem] text-lg font-medium leading-snug tracking-[-0.02em] text-lp-pink sm:text-2xl"
          style={{ animationDelay: `${250 + afterWords}ms` }}
        >
          {t("subtitle")}
        </p>
        <div className="lp-rise mt-2" style={{ animationDelay: `${400 + afterWords}ms` }}>
          <WaitlistForm />
        </div>
      </Container>
    </section>
  );
}
