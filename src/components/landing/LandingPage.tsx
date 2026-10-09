import { gambarino, switzer } from "./fonts";
import { Hero } from "./Hero";
import { LandingNav } from "./LandingNav";
import {
  AppSection,
  FaqSection,
  FeaturesSection,
  LandingFooter,
  ProblemSection,
  StepsSection,
  StorySection,
  WaitlistSection,
} from "./Sections";

/**
 * The public page on "/" for visitors who aren't logged in: what Runvex is, for
 * whom, how it works, and the waitlist for the App Store launch. Full width, no tab bar.
 * Design: Figma file "Runvex landing" (Desktop - 1).
 */
export function LandingPage() {
  return (
    <div
      className={`landing ${gambarino.variable} ${switzer.variable} relative min-h-dvh overflow-x-clip bg-lp-bg font-body text-lp-chalk`}
    >
      <LandingNav />
      <main>
        <Hero />
        <ProblemSection />
        <StepsSection />
        <FeaturesSection />
        <AppSection />
        <StorySection />
        <WaitlistSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
