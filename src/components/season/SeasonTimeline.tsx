import { useFormatter, useTranslations } from "next-intl";
import { toFormattableDate } from "@/core/dates";
import type { Phase, SeasonWeek } from "@/core/periodization";
import { weekTypeColors } from "./SeasonBadge";

type SeasonTimelineProps = {
  weeks: SeasonWeek[];
  /** Monday of this week, to mark where you are. */
  currentWeek: string;
};

/**
 * Every week up to race day as a bar: its height is the volume, its color the kind
 * of week. Under it the phases, so you see the build-up over the whole season.
 */
export function SeasonTimeline({ weeks, currentWeek }: SeasonTimelineProps) {
  const t = useTranslations("Season");
  const format = useFormatter();

  // The phases in order, with how many weeks each lasts.
  const phases: { phase: Phase; weeks: number }[] = [];
  for (const week of weeks) {
    const last = phases.at(-1);
    if (last && last.phase === week.phase) last.weeks++;
    else phases.push({ phase: week.phase, weeks: 1 });
  }
  const date = (iso: string) => format.dateTime(toFormattableDate(iso), { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="flex flex-col gap-3">
      <div role="img" aria-label={t("timelineLabel", { weeks: weeks.length })} className="flex h-28 items-end gap-[2px]">
        {weeks.map((week) => (
          <span
            key={week.weekStart}
            className={`bar-grow-up flex-1 rounded-t-sm ${weekTypeColors[week.type].bar} ${
              week.weekStart === currentWeek ? "outline-2 outline-offset-1 outline-foreground" : ""
            } ${week.weekStart < currentWeek ? "opacity-35" : ""}`}
            style={{ height: `${Math.max(8, week.volume * 100)}%` }}
          />
        ))}
      </div>

      <div className="flex gap-[2px] text-[0.6rem] font-bold uppercase tracking-wider text-muted">
        {phases.map(({ phase, weeks: count }, index) => (
          <span key={index} className="truncate border-t border-white/15 pt-1" style={{ flex: count }}>
            {count >= 2 ? t(`phase.${phase}`) : ""}
          </span>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted">
        <span>{date(weeks[0].weekStart)}</span>
        <span>{date(weeks.at(-1)!.weekStart)}</span>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        {(["build", "recovery", "taper", "race"] as const).map((type) => (
          <li key={type} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-sm ${weekTypeColors[type].bar}`} />
            {t(`type.${type}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
