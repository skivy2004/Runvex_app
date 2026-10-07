import { Flame, User } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toFormattableDate } from "@/core/dates";
import type { PartOfDay } from "@/core/home";

type HomeHeaderProps = {
  name: string | null;
  today: string;
  partOfDay: PartOfDay;
  /** Trainings done in a row; the flame only shows from 1. */
  streak: number;
};

/** Avatar, the date, "Good morning, Jeremy" and your streak. */
export function HomeHeader({ name, today, partOfDay, streak }: HomeHeaderProps) {
  const t = useTranslations("Home");
  const format = useFormatter();
  const initials = name ? name.slice(0, 2).toUpperCase() : null;

  return (
    <header className="flex items-center gap-3">
      <span
        aria-hidden
        className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue to-blue/60 text-sm font-bold"
      >
        {initials ?? <User className="size-5" />}
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-background bg-accent" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="eyebrow">
          {/* timeZone "UTC" because `today` is already the user's local date. */}
          {format.dateTime(toFormattableDate(today), { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })}
        </p>
        <h1 className="truncate text-xl font-bold">
          {name ? t(`greeting.${partOfDay}`, { name }) : t(`greetingNoName.${partOfDay}`)}
        </h1>
      </div>
      {streak > 0 && (
        <span
          title={t("streak", { count: streak })}
          className="flex shrink-0 items-center gap-1 rounded-2xl border border-coral/30 bg-coral/10 px-3 py-2 text-sm font-bold text-coral"
        >
          <Flame aria-hidden className="streak-flame size-4" />
          {streak}
          <span className="sr-only">{t("streak", { count: streak })}</span>
        </span>
      )}
    </header>
  );
}
