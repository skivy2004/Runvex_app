import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SportIcon } from "@/components/SportIcon";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import { getWorkout, zoneLegend } from "@/core/workouts/library";
import type { PlannedWorkout } from "@/services/workouts";
import { WorkoutDetails } from "./WorkoutDetails";
import { WorkoutDialog } from "./WorkoutDialog";

type WorkoutCardProps = {
  workout: PlannedWorkout;
  /** True when this is the long run / long ride of the week. */
  isLongSession?: boolean;
  /** Optional content on the right, e.g. "Tomorrow". */
  trailing?: ReactNode;
  /** Buttons at the bottom of the window: swap, move, delete. */
  actions?: ReactNode;
};

/**
 * A training. On the page it shows sport, name and length; tap it and it opens as
 * a window with the whole workout.
 */
export function WorkoutCard({ workout, isLongSession = false, trailing, actions }: WorkoutCardProps) {
  const t = useTranslations("Workout");
  const tSports = useTranslations("Sports");
  const tLong = useTranslations("LongSessions");
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const formatDistance = useFormatDistance();

  const template = workout.template_id ? getWorkout(workout.template_id) : undefined;
  const libraryName = template?.name[locale];
  // The long session simply shows as "Long run" / "Long ride"; the workout name is inside.
  const longName =
    isLongSession && (workout.sport === "running" || workout.sport === "cycling") ? tLong(workout.sport) : null;
  const title = longName ?? libraryName ?? workout.title;

  // Swims are planned by distance; their duration is an estimate for your level.
  const length =
    template?.target === "distance" && template.distanceMeters !== null
      ? `${formatDistance(template.distanceMeters, template.sport)} · ${t("estimated", { duration: formatDuration(workout.duration_minutes) })}`
      : formatDuration(workout.duration_minutes);

  const summary = (
    <span className="flex items-center gap-3">
      <SportIcon sport={workout.sport} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{title}</span>
        <span className="text-sm text-muted">
          {tSports(workout.sport)} · {length}
        </span>
      </span>
      {trailing}
    </span>
  );

  // A training you added yourself, without notes or actions, has nothing to open.
  if (!template && !workout.notes && !actions) {
    return <div className="rounded-2xl bg-surface-raised p-3">{summary}</div>;
  }

  return (
    <WorkoutDialog summary={summary} title={title}>
      {template && (
        <>
          {longName && <p className="-mb-2 font-semibold">{libraryName}</p>}
          <WorkoutDetails
            description={template.description[locale]}
            sport={template.sport}
            steps={template.steps}
            zones={zoneLegend(template, locale)}
            swim={template.swim}
            locale={locale}
          />
        </>
      )}

      {workout.notes && (
        <section className="flex flex-col gap-1 rounded-xl bg-accent/10 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">{t("whyTitle")}</h3>
          <p className="text-sm">{workout.notes}</p>
        </section>
      )}

      {actions}
    </WorkoutDialog>
  );
}
