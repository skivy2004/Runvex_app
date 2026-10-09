"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Container } from "./Section";

/** How far the page has to scroll before the bar gets its background and button. */
const SCROLL_THRESHOLD = 80;

/**
 * The bar at the top: logo, the section links and the waitlist button. Stays on
 * top while scrolling. Over the hero it's see-through and without a button (the
 * hero has its own form); once you scroll, the background and button fade in.
 */
export function LandingNav() {
  const t = useTranslations("Landing.nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const links = [
    { href: "#how", label: t("how") },
    { href: "#features", label: t("features") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 pt-[env(safe-area-inset-top)] transition-[background-color] duration-300 ease-out motion-reduce:transition-none ${
        scrolled ? "bg-lp-bg/70 backdrop-blur-lg" : "bg-transparent backdrop-blur-none"
      }`}
    >
      <Container className="flex h-[72px] items-center justify-between gap-6">
        <a href="#top" className="font-display text-[2rem] leading-none tracking-[-0.05em] text-lp-coral sm:text-[2.5rem]">
          Runvex
        </a>
        <nav aria-label="Runvex" className="hidden items-center gap-12 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="font-display text-xl tracking-[-0.03em] text-lp-pink transition-colors duration-150 [transition-timing-function:ease] hover:text-lp-chalk">
              {link.label}
            </a>
          ))}
        </nav>
        {/* Hidden (and unreachable by keyboard) until you scroll: the hero has its own form. */}
        <a
          href="#waitlist"
          inert={!scrolled}
          className={`inline-flex h-11 items-center rounded-[15px] bg-lp-coral px-5 text-base font-medium text-lp-bg transition-[opacity,translate,scale,filter] duration-300 ease-out hover:brightness-110 active:scale-[0.97] motion-reduce:transition-none sm:text-lg ${
            scrolled ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
          }`}
        >
          {t("cta")}
        </a>
      </Container>
    </header>
  );
}
