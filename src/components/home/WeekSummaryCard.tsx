import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useFormatDuration } from "@/components/useFormatDuration";
import { weekdays } from "@/core/training";
import { CardHeader } from "./CardHeader";

type WeekSummaryCardProps = {
  plannedMinutes: number;
  /** Available minutes per weekday, index 0 = Monday. */
  availability: number[];
  /** 1 = Monday ... 7 = Sunday */
  todayWeekday: number;
  /** Trainings of this week: how many there are and how many you did. */
  trainings?: { done: number; total: number };
};

export function WeekSummaryCard({ plannedMinutes, availability, todayWeekday, trainings }: WeekSummaryCardProps) {
  const t = useTranslations("Home");
  const tFeedback = useTranslations("Feedback");
  const tShort = useTranslations("WeekdaysShort");
  const tWeekdays = useTranslations("Weekdays");
  const formatDuration = useFormatDuration();
  const availableMinutes = availability.reduce((sum, minutes) => sum + minutes, 0);

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("thisWeek")} link={{ href: "/week", label: t("seeWeek") }} />

      <div className="flex flex-col gap-3">
        <p className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-accent">{formatDuration(plannedMinutes)}</span>
          <span className="text-sm text-muted">
            {t("ofAvailable", { available: formatDuration(availableMinutes) })}
          </span>
        </p>
        <ProgressBar value={plannedMinutes} max={availableMinutes} label={t("progressLabel")} />
        {trainings && trainings.total > 0 && (
          <p className="text-sm font-semibold text-muted">{tFeedback("weekDone", trainings)}</p>
        )}
      </div>

      {/* Mini week: which days you have time to train, with today highlighted. */}
      <ul className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((weekday, index) => {
          const minutes = availability[index];
          const isToday = index + 1 === todayWeekday;
          return (
            <li key={weekday} className="flex flex-col items-center gap-1.5">
              <span
                aria-hidden
                className={`text-xs font-semibold ${isToday ? "text-accent" : "text-muted"}`}
              >
                {tShort(weekday)}
              </span>
              <span
                className={`size-2.5 rounded-full ${minutes > 0 ? "bg-accent" : "bg-surface-raised"} ${
                  isToday ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-surface" : ""
                }`}
              />
              {/* Read by screen readers instead of the letter and dot. */}
              <span className="sr-only">
                {tWeekdays(weekday)}: {minutes > 0 ? formatDuration(minutes) : t("restDay")}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
