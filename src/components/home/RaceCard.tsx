import { ChevronRight, Flag } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { toFormattableDate } from "@/core/dates";
import type { CurrentGoal } from "@/services/goals";
import { RaceCountdown } from "./RaceCountdown";

type RaceCardProps = {
  goal: CurrentGoal | null;
  today: string;
  timeZone: string;
};

const cardClass =
  "relative flex flex-col gap-4 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-blue/25 via-surface/70 to-coral/20 p-5 backdrop-blur-xl";

/** Your race with a live countdown, or a nudge to set a goal. */
export function RaceCard({ goal, today, timeZone }: RaceCardProps) {
  const t = useTranslations("Home");
  const format = useFormatter();

  if (!goal) {
    return (
      <Link href="/goal" prefetch className={`${cardClass} transition active:scale-[0.98]`}>
        <p className="eyebrow">{t("goal")}</p>
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Flag className="size-5" />
          </span>
          <div className="flex flex-1 flex-col">
            <p className="text-lg font-bold">{t("noGoal")}</p>
            <p className="text-sm text-muted">{t("noGoalText")}</p>
          </div>
          <ChevronRight aria-hidden className="size-5 text-muted" />
        </div>
      </Link>
    );
  }

  const name = goal.event_name ?? goal.description;

  return (
    <Link href="/goal" prefetch className={`${cardClass} transition active:scale-[0.98]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="eyebrow">
            {goal.event_date
              ? `${t("race")} · ${format.dateTime(toFormattableDate(goal.event_date), { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`
              : t("goal")}
          </p>
          <p className="truncate text-xl font-bold">{name}</p>
        </div>
        <ChevronRight aria-hidden className="mt-1 size-5 shrink-0" />
      </div>
      {goal.event_date &&
        (goal.event_date === today ? (
          <p className="text-4xl font-bold text-accent">{t("raceDay")}</p>
        ) : (
          <RaceCountdown date={goal.event_date} timeZone={timeZone} />
        ))}
    </Link>
  );
}
