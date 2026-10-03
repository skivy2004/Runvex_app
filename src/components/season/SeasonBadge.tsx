import { useTranslations } from "next-intl";
import type { SeasonWeek } from "@/core/periodization";

/** Colors per kind of week: building coral, recovery blue, taper chalk, race strong coral. */
export const weekTypeColors: Record<SeasonWeek["type"], { bar: string; pill: string }> = {
  build: { bar: "bg-coral/70", pill: "bg-coral/15 text-coral" },
  recovery: { bar: "bg-blue-light/70", pill: "bg-blue/30 text-blue-light" },
  taper: { bar: "bg-foreground/60", pill: "bg-foreground/10 text-foreground" },
  race: { bar: "bg-coral", pill: "bg-coral text-accent-foreground" },
};

/** "Build · week 2 of 3", "Recovery week", "Taper · week 1 of 2" or "Race week". */
export function useSeasonLabel() {
  const t = useTranslations("Season");
  return (week: SeasonWeek) => {
    if (week.type === "race") return t("raceWeek");
    if (week.type === "recovery") return t("recoveryWeek");
    const buildWeeks = week.phase === "taper" ? week.blockLength : week.blockLength - (week.phase === "peak" ? 0 : 1);
    return t("label", { phase: t(`phase.${week.phase}`), week: week.weekInBlock, weeks: Math.max(buildWeeks, week.weekInBlock) });
  };
}

/** A small pill with where this week sits in the training blocks. */
export function SeasonBadge({ week }: { week: SeasonWeek }) {
  const label = useSeasonLabel();
  return (
    <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${weekTypeColors[week.type].pill}`}>
      {label(week)}
    </span>
  );
}
