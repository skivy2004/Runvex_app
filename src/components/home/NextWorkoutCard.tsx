import { CalendarPlus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { PlanWeekButton } from "@/components/week/PlanWeekButton";
import { WorkoutCard } from "@/components/week/WorkoutCard";
import { daysBetween, startOfWeek, toFormattableDate } from "@/core/dates";
import type { PlannedWorkout } from "@/services/workouts";
import { CardHeader } from "./CardHeader";

type NextWorkoutCardProps = {
  workout: PlannedWorkout | null;
  today: string;
  /** True when this workout is the long run / long ride of its day. */
  isLongSession?: boolean;
};

export function NextWorkoutCard({ workout, today, isLongSession = false }: NextWorkoutCardProps) {
  const t = useTranslations("Home");
  const format = useFormatter();

  if (!workout) {
    return (
      <Card className="flex flex-col gap-4">
        <CardHeader title={t("nextTraining")} />
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-muted"
          >
            <CalendarPlus className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold">{t("nothingPlanned")}</p>
            <p className="text-sm text-muted">{t("nothingPlannedText")}</p>
          </div>
        </div>
        <PlanWeekButton weekStart={startOfWeek(today)} />
      </Card>
    );
  }

  const daysAway = daysBetween(today, workout.scheduled_on);
  const when =
    daysAway === 0
      ? t("today")
      : daysAway === 1
        ? t("tomorrow")
        : // Short ("Sat 4 Oct"), so it fits next to the title and the arrow.
          format.dateTime(toFormattableDate(workout.scheduled_on), {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          });

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("nextTraining")} link={{ href: "/week", label: t("seeWeek") }} />
      {/* The same card as in the week view: tap it to see the whole training. */}
      <WorkoutCard
        workout={workout}
        isLongSession={isLongSession}
        canCheckOff={daysAway <= 0}
        trailing={
          <span className="shrink-0 text-sm font-semibold text-accent first-letter:uppercase">{when}</span>
        }
      />
    </Card>
  );
}
