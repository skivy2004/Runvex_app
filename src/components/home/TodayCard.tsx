import { ArrowRight, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SportIcon } from "@/components/SportIcon";
import { sportColors } from "@/components/sportColors";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import { PlanWeekButton } from "@/components/week/PlanWeekButton";
import { WorkoutCard } from "@/components/week/WorkoutCard";
import { startOfWeek } from "@/core/dates";
import { getWorkout } from "@/core/workouts/library";
import type { PlannedWorkout } from "@/services/workouts";
import { useWhenLabel } from "./useWhenLabel";

type TodayCardProps = {
  /** The next training still to do, or null. */
  workout: PlannedWorkout | null;
  today: string;
  /** Part of this week's planned minutes you did, 0-1. */
  weekDone: number;
};

/** How hard a library workout is, from its difficulty 1-5. */
function intensityOf(difficulty: number) {
  return difficulty <= 2 ? "easy" : difficulty === 3 ? "moderate" : "hard";
}

const intensityColors = { easy: "text-blue-light", moderate: "text-warning", hard: "text-coral" } as const;

/** The big card: your next training, how hard it is, and a button to open it. */
export function TodayCard({ workout, today, weekDone }: TodayCardProps) {
  const t = useTranslations("Home");
  const tSports = useTranslations("Sports");
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const formatDistance = useFormatDistance();
  const whenLabel = useWhenLabel(today);

  const template = workout?.template_id ? getWorkout(workout.template_id) : undefined;
  const intensity = template ? intensityOf(template.difficulty) : null;
  const percent = Math.round(weekDone * 100);

  // How much of this week you did, as a ring.
  const ring = (
    <ProgressRing value={weekDone} strokeClass="stroke-accent" size={104} thickness={8} label={t("weekDoneLabel", { percent })}>
      <span className="flex flex-col items-center leading-none">
        <span className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">{t("week")}</span>
        <span className="mt-1 text-3xl font-bold">{percent}</span>
        <span className="text-xs text-muted">%</span>
      </span>
    </ProgressRing>
  );

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-surface/90 to-surface/50 p-5 backdrop-blur-xl">
      {/* Decorative circle in the corner, like in the design. */}
      <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full border border-white/[0.06]" />

      <div className="flex items-center justify-between">
        <p className="eyebrow flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
          {t("todaysSession")}
        </p>
        {workout && (
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            {whenLabel(workout.scheduled_on)}
          </span>
        )}
      </div>

      {!workout ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-bold leading-tight tracking-tight">{t("nothingPlanned")}</p>
              <p className="text-sm text-muted">{t("nothingPlannedText")}</p>
            </div>
            {ring}
          </div>
          <PlanWeekButton weekStart={startOfWeek(today)} />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {workout.scheduled_on > today && (
            <p className="-mb-2 text-sm text-muted">{t("restDayToday")}</p>
          )}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-3">
              <span
                className={`flex w-fit items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider ${sportColors[workout.sport].soft} ${sportColors[workout.sport].text}`}
              >
                <SportIcon sport={workout.sport} small className="!size-4 !bg-transparent" />
                {tSports(workout.sport)}
              </span>
              <h2 className="text-[2.1rem] font-bold leading-[1.02] tracking-tight">
                {template?.name[locale] ?? workout.title}
              </h2>
              <p className="text-sm font-bold">
                {formatDuration(workout.duration_minutes)}
                {template?.distanceMeters ? (
                  <span className="text-muted">
                    <span className="mx-1.5 text-accent">•</span>
                    {formatDistance(template.distanceMeters, template.sport)}
                  </span>
                ) : null}
              </p>
            </div>
            {ring}
          </div>

          {template && intensity && (
            <div className="flex flex-col gap-2">
              <p className="flex justify-between text-[0.65rem] font-bold uppercase tracking-[0.18em]">
                <span className="text-muted">{t("intensity")}</span>
                <span className={intensityColors[intensity]}>{t(`intensityLevel.${intensity}`)}</span>
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="bar-grow h-full rounded-full bg-gradient-to-r from-blue to-coral"
                  style={{ width: `${(template.difficulty / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* The big button opens the whole training, with check-off from its day on. */}
          <WorkoutCard
            workout={workout}
            canCheckOff={workout.scheduled_on <= today}
            triggerClassName="auth-cta flex h-14 w-full items-center gap-3 rounded-2xl bg-accent px-5 text-left font-bold text-accent-foreground transition active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            trigger={
              <>
                <Zap aria-hidden className="size-5" />
                <span className="flex-1">{t(workout.scheduled_on <= today ? "startWorkout" : "viewWorkout")}</span>
                <ArrowRight aria-hidden className="size-5" />
              </>
            }
          />
        </div>
      )}
    </section>
  );
}
