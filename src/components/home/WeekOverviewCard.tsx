import { useFormatter, useTranslations } from "next-intl";
import { sportIcons } from "@/components/SportIcon";
import { sportColors } from "@/components/sportColors";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useFormatDuration } from "@/components/useFormatDuration";
import { addDays, toFormattableDate } from "@/core/dates";
import type { SportProgress } from "@/core/home";
import type { Sport } from "@/core/training";
import { weekdays } from "@/core/training";

type WeekOverviewCardProps = {
  progress: SportProgress[];
  weekStart: string;
  today: string;
  /** This week's trainings: their day, sport and whether you did them. */
  workouts: { scheduled_on: string; sport: Sport; status: string }[];
};

/** Per sport a ring with the time done this week, and a mini calendar with your trainings. */
export function WeekOverviewCard({ progress, weekStart, today, workouts }: WeekOverviewCardProps) {
  const t = useTranslations("Home");
  const tSports = useTranslations("Sports");
  const tShort = useTranslations("WeekdaysShort");
  const format = useFormatter();
  const formatDuration = useFormatDuration();

  return (
    <Card className="flex flex-col gap-5">
      {progress.length > 0 ? (
        <ul className="flex justify-around gap-2">
          {progress.map(({ sport, plannedMinutes, doneMinutes }) => {
            const Icon = sportIcons[sport];
            return (
              <li key={sport} className="flex flex-col items-center gap-2 text-center">
                <ProgressRing
                  value={plannedMinutes === 0 ? 0 : doneMinutes / plannedMinutes}
                  strokeClass={sportColors[sport].stroke}
                  size={76}
                  label={t("sportDoneLabel", { sport: tSports(sport), done: formatDuration(doneMinutes), planned: formatDuration(plannedMinutes) })}
                >
                  <Icon aria-hidden className={`size-6 ${sportColors[sport].text}`} />
                </ProgressRing>
                <span className="flex flex-col leading-tight">
                  <span className="font-bold">{formatDuration(doneMinutes)}</span>
                  <span className="text-[0.65rem] text-muted">{t("ofPlanned", { planned: formatDuration(plannedMinutes) })}</span>
                  <span className="mt-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">{tSports(sport)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t("nothingPlannedText")}</p>
      )}

      {/* Mini calendar: today highlighted, a dot per training (filled when done). */}
      <ol className="grid grid-cols-7 gap-1 border-t border-white/[0.08] pt-4 text-center">
        {weekdays.map((weekday, index) => {
          const date = addDays(weekStart, index);
          const isToday = date === today;
          const ofDay = workouts.filter((workout) => workout.scheduled_on === date);
          return (
            <li key={weekday} className="flex flex-col items-center gap-1.5">
              <span aria-hidden className="text-[0.65rem] font-bold text-muted">
                {tShort(weekday)}
              </span>
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                  isToday ? "bg-accent text-accent-foreground shadow-[0_0_16px_rgb(239_106_69/0.5)]" : ""
                }`}
              >
                {format.dateTime(toFormattableDate(date), { day: "numeric", timeZone: "UTC" })}
              </span>
              <span className="flex h-1.5 gap-0.5" aria-hidden>
                {ofDay.map((workout, i) => (
                  <span
                    key={i}
                    className={`size-1.5 rounded-full ${sportColors[workout.sport].solid} ${workout.status === "done" ? "" : "opacity-35"}`}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
