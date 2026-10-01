import { TriangleAlert } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { SportIcon } from "@/components/SportIcon";
import { useFormatDuration } from "@/components/useFormatDuration";
import { WorkoutRow } from "@/components/WorkoutRow";
import { toFormattableDate } from "@/core/dates";
import type { LongSessionSport } from "@/core/availability";
import type { Sport } from "@/core/training";
import type { PlannedWorkout } from "@/services/workouts";

type DayCardProps = {
  date: string;
  availableMinutes: number;
  /** Sports the user wants to do on this weekday (empty = flexible). */
  preferredSports?: Sport[];
  /** Long run / long ride planned on this weekday. */
  longSessions?: LongSessionSport[];
  workouts: PlannedWorkout[];
  isToday: boolean;
  isPast: boolean;
};

export function DayCard({
  date,
  availableMinutes,
  preferredSports = [],
  longSessions = [],
  workouts,
  isToday,
  isPast,
}: DayCardProps) {
  const t = useTranslations("Week");
  const tSports = useTranslations("Sports");
  const tLong = useTranslations("LongSessions");
  const format = useFormatter();
  const formatDuration = useFormatDuration();

  const plannedMinutes = workouts.reduce((sum, workout) => sum + workout.duration_minutes, 0);
  const isRestDay = availableMinutes === 0;
  // A warning, not an error: you're allowed to plan more, the app just points it out.
  const warning =
    plannedMinutes === 0
      ? null
      : isRestDay
        ? t("trainingOnRestDay")
        : plannedMinutes > availableMinutes
          ? t("overAvailable", { over: formatDuration(plannedMinutes - availableMinutes) })
          : null;

  return (
    <section
      // aria-current tells screen readers which day is today.
      aria-current={isToday ? "date" : undefined}
      className={`flex flex-col gap-3 rounded-3xl border p-4 ${
        isToday ? "border-accent bg-accent/5" : "border-transparent bg-surface"
      } ${isPast ? "opacity-60" : ""}`}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold first-letter:uppercase">
            {format.dateTime(toFormattableDate(date), {
              weekday: "long",
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })}
          </h2>
          {isToday && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
              {t("today")}
            </span>
          )}
        </div>
        <span className="flex items-center gap-2">
          {!isRestDay && preferredSports.length > 0 && (
            <span className="flex gap-1">
              {preferredSports.map((sport) => (
                <SportIcon key={sport} sport={sport} small />
              ))}
              <span className="sr-only">{preferredSports.map((sport) => tSports(sport)).join(", ")}</span>
            </span>
          )}
          <span className={`text-sm ${isRestDay ? "text-muted" : "font-semibold text-accent"}`}>
            {isRestDay ? t("restDay") : formatDuration(availableMinutes)}
          </span>
        </span>
      </header>

      {!isRestDay && longSessions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {longSessions.map((sport) => (
            <span
              key={sport}
              className="rounded-full border border-accent/40 px-2.5 py-0.5 text-xs font-semibold text-accent"
            >
              {tLong(sport)}
            </span>
          ))}
        </div>
      )}

      {workouts.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {workouts.map((workout) => (
            <li key={workout.id}>
              <WorkoutRow workout={workout} />
            </li>
          ))}
        </ul>
      ) : (
        !isRestDay && <p className="text-sm text-muted">{t("noTraining")}</p>
      )}

      {warning && (
        <p className="flex items-center gap-1.5 text-sm text-warning">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {warning}
        </p>
      )}
    </section>
  );
}
