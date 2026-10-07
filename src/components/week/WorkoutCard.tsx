import { Check, Printer } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SportIcon } from "@/components/SportIcon";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import { statusOf } from "@/core/validation/feedback";
import { getWorkout, zoneLegend } from "@/core/workouts/library";
import type { Activity } from "@/services/activities";
import type { PlannedWorkout } from "@/services/workouts";
import { ActivityStats } from "./ActivityStats";
import { WorkoutDetails } from "./WorkoutDetails";
import { WorkoutDialog } from "./WorkoutDialog";
import { WorkoutFeedback } from "./WorkoutFeedback";

type WorkoutCardProps = {
  workout: PlannedWorkout;
  /** What your watch recorded for it, when you uploaded the activity. */
  activity?: Activity;
  /** True when this is the long run / long ride of the week. */
  isLongSession?: boolean;
  /** Optional content on the right, e.g. "Tomorrow". */
  trailing?: ReactNode;
  /** Buttons at the bottom of the window: swap, move, delete. */
  actions?: ReactNode;
  /** True from the training's day on: then you can check it off as done or skipped. */
  canCheckOff?: boolean;
  /** A different look on the page (e.g. the big card on Home); the window stays the same. */
  trigger?: ReactNode;
  triggerClassName?: string;
};

/**
 * A training. On the page it shows sport, name and length; tap it and it opens as
 * a window with the whole workout.
 */
export function WorkoutCard({
  workout,
  activity,
  isLongSession = false,
  trailing,
  actions,
  canCheckOff = false,
  trigger,
  triggerClassName,
}: WorkoutCardProps) {
  const t = useTranslations("Workout");
  const tFeedback = useTranslations("Feedback");
  const status = statusOf(workout.status);
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
      <span className={`flex min-w-0 flex-1 flex-col ${status === "skipped" ? "opacity-50" : ""}`}>
        <span className={`truncate font-semibold ${status === "skipped" ? "line-through" : ""}`}>{title}</span>
        <span className="text-sm text-muted">
          {tSports(workout.sport)} · {length}
        </span>
      </span>
      {status === "done" && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
          <Check aria-hidden className="size-3.5" strokeWidth={3} />
          {workout.rpe ? tFeedback("rpeShort", { rpe: workout.rpe }) : tFeedback("done")}
        </span>
      )}
      {status === "skipped" && <span className="shrink-0 text-xs font-semibold text-muted">{tFeedback("skipped")}</span>}
      {trailing}
    </span>
  );

  // A training you added yourself, without notes or actions, has nothing to open.
  if (!template && !workout.notes && !actions && !canCheckOff && !activity) {
    return trigger ? (
      <div className={triggerClassName}>{trigger}</div>
    ) : (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3">{summary}</div>
    );
  }

  return (
    <WorkoutDialog summary={summary} title={title} trigger={trigger} triggerClassName={triggerClassName}>
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

      {template?.swim && (
        <Link
          href={`/print/${workout.id}`}
          className="flex items-center justify-center gap-2 rounded-full bg-surface-raised px-4 py-2.5 text-sm font-semibold transition hover:bg-line"
        >
          <Printer aria-hidden className="size-4" />
          {t("printCard")}
        </Link>
      )}

      {activity && <ActivityStats activity={activity} />}

      {canCheckOff && (
        <WorkoutFeedback workoutId={workout.id} status={status} rpe={workout.rpe} note={workout.feedback_note} />
      )}

      {/* A training you did can't be swapped or moved anymore, only deleted. */}
      {actions}
    </WorkoutDialog>
  );
}
