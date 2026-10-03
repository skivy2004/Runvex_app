import { useTranslations } from "next-intl";
import type { SeasonWeek } from "@/core/periodization";
import { RecoveryWeekToggle } from "./RecoveryWeekToggle";
import { SeasonBadge } from "./SeasonBadge";

type SeasonWeekCardProps = {
  week: SeasonWeek;
  /** False for past weeks: those can't change anymore. */
  canChange: boolean;
  /** True when you turned this week into a recovery week yourself. */
  isOverride: boolean;
};

/** On the week page: where this week sits in the blocks, what it's for, and a recovery switch. */
export function SeasonWeekCard({ week, canChange, isOverride }: SeasonWeekCardProps) {
  const t = useTranslations("Season");
  const explanation = week.type === "build" ? t(`explain.${week.phase}`) : t(`explain.${week.type}`);

  return (
    <section className="flex flex-col gap-3 rounded-[1.75rem] border border-white/[0.08] bg-surface/70 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2">
        <SeasonBadge week={week} />
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          {t("volume", { percent: Math.round(week.volume * 100) })}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted">{explanation}</p>
      {canChange && (week.type === "build" || isOverride) && <RecoveryWeekToggle weekStart={week.weekStart} isOverride={isOverride} />}
    </section>
  );
}
