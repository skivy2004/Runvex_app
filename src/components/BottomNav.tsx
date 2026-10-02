"use client";

import { CalendarDays, House, Plus, Target, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type Tab = {
  href: string;
  labelKey: "home" | "week" | "goal" | "profile";
  icon: LucideIcon;
};

const leftTabs: Tab[] = [
  { href: "/", labelKey: "home", icon: House },
  { href: "/week", labelKey: "week", icon: CalendarDays },
];
const rightTabs: Tab[] = [
  { href: "/goal", labelKey: "goal", icon: Target },
  { href: "/profile", labelKey: "profile", icon: User },
];

function TabLink({ tab, isActive }: { tab: Tab; isActive: boolean }) {
  const t = useTranslations("Nav");
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      // Load the whole tab in the background right away, so switching tabs is instant.
      prefetch
      // Tells screen readers which tab is the current page.
      aria-current={isActive ? "page" : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
        isActive ? "text-accent" : "text-muted hover:text-foreground"
      }`}
    >
      <Icon aria-hidden className="size-5" strokeWidth={isActive ? 2.5 : 2} />
      {t(tab.labelKey)}
    </Link>
  );
}

export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    // Fixed to the bottom of the screen; the inner div keeps it as wide as the app column.
    // The bar's own background runs down behind the iPhone home bar (the safe area),
    // while the tabs stay above it.
    <nav aria-label={t("label")} className="fixed inset-x-0 bottom-0 z-10">
      <div className="mx-auto flex max-w-md items-end rounded-t-3xl border-t border-line bg-surface px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        {leftTabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} isActive={isActive(tab.href)} />
        ))}

        {/* Raised round button in the middle, like in the design: add a training. */}
        <div className="flex flex-1 justify-center">
          <Link
            href="/add"
            prefetch
            aria-label={t("add")}
            className="-mt-7 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/20 ring-4 ring-background transition active:scale-95"
          >
            <Plus aria-hidden className="size-7" strokeWidth={2.5} />
          </Link>
        </div>

        {rightTabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} isActive={isActive(tab.href)} />
        ))}
      </div>
    </nav>
  );
}
