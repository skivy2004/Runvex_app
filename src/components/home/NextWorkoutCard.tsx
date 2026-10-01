import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WorkoutRow } from "@/components/WorkoutRow";
import { daysBetween, toFormattableDate } from "@/core/dates";
import type { PlannedWorkout } from "@/services/workouts";
import { CardHeader } from "./CardHeader";

type NextWorkoutCardProps = {
  workout: PlannedWorkout | null;
  today: string;
};

export function NextWorkoutCard({ workout, today }: NextWorkoutCardProps) {
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
        <Link href="/week" className={buttonClassName({ fullWidth: true })}>
          {t("planWeek")}
        </Link>
      </Card>
    );
  }

  const daysAway = daysBetween(today, workout.scheduled_on);
  const when =
    daysAway === 0
      ? t("today")
      : daysAway === 1
        ? t("tomorrow")
        : format.dateTime(toFormattableDate(workout.scheduled_on), {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          });

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("nextTraining")} link={{ href: "/week", label: t("seeWeek") }} />
      <WorkoutRow
        workout={workout}
        trailing={
          <span className="text-sm font-semibold text-accent first-letter:uppercase">{when}</span>
        }
      />
    </Card>
  );
}
