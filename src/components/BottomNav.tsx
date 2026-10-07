"use client";

import { CalendarDays, House, MessageCircle, Target, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Tab = {
  href: string;
  labelKey: "home" | "plan" | "coach" | "goal" | "profile";
  icon: LucideIcon;
};

const tabs: Tab[] = [
  { href: "/", labelKey: "home", icon: House },
  { href: "/week", labelKey: "plan", icon: CalendarDays },
  { href: "/coach", labelKey: "coach", icon: MessageCircle },
  { href: "/goal", labelKey: "goal", icon: Target },
  { href: "/profile", labelKey: "profile", icon: User },
];

/**
 * The floating glass tab bar. A Burnt Coral square sits behind the active tab's icon
 * and slides to the next tab when you switch.
 */
export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  // "Add training" (/add) belongs to the plan.
  const activeIndex = pathname.startsWith("/add") ? 1 : tabs.findIndex((tab) => isActive(tab.href));

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))]"
    >
      <div className="relative mx-auto grid max-w-md grid-cols-5 rounded-[1.75rem] border border-white/10 border-t-white/20 bg-surface/75 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl backdrop-saturate-150">
        {/* The sliding indicator: one fifth wide, moved to the active tab. */}
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-2 left-2 flex h-10 w-[calc((100%-1rem)/5)] justify-center transition-transform duration-[220ms] ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            <span className="size-10 rounded-2xl bg-accent shadow-[0_0_20px_rgb(239_106_69/0.45)]" />
          </span>
        )}
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = index === activeIndex;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              // Load the whole tab in the background right away, so switching tabs is instant.
              prefetch
              // Tells screen readers which tab is the current page.
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center gap-1 text-[11px] font-semibold"
            >
              <span
                className={`flex size-10 items-center justify-center transition-colors duration-300 ${
                  active ? "text-accent-foreground" : "text-muted"
                }`}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={active ? "text-accent" : "text-muted"}>{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
