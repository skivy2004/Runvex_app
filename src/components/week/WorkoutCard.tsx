import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SportIcon } from "@/components/SportIcon";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import { getWorkout, zoneDescription } from "@/core/workouts/library";
import type { PlannedWorkout } from "@/services/workouts";
import { usedZones, WorkoutSteps, ZoneBadge } from "./WorkoutSteps";

type WorkoutCardProps = {
  workout: PlannedWorkout;
  /** True when this is the long run / long ride of the week. */
  isLongSession?: boolean;
  /** Optional content on the right, e.g. "Tomorrow". */
  trailing?: ReactNode;
};

/**
 * A training in the week view. Closed it shows sport, name and length; tap it to
 * open the whole workout. <details> does the opening and closing itself, without
 * JavaScript, and works with the keyboard and screen readers out of the box.
 */
export function WorkoutCard({ workout, isLongSession = false, trailing }: WorkoutCardProps) {
  const t = useTranslations("Workout");
  const tSports = useTranslations("Sports");
  const tLong = useTranslations("LongSessions");
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const formatDistance = useFormatDistance();

  const template = workout.template_id ? getWorkout(workout.template_id) : undefined;
  const libraryName = template?.name[locale];
  // The long session simply shows as "Long run" / "Long ride"; the workout name is inside.
  const longName = isLongSession && (workout.sport === "running" || workout.sport === "cycling")
    ? tLong(workout.sport)
    : null;
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

  // A training you added yourself without notes has nothing to open.
  if (!template && !workout.notes) {
    return <div className="rounded-2xl bg-surface-raised p-3">{summary}</div>;
  }

  const sport = template?.sport;
  return (
    <details className="workout-card group rounded-2xl bg-surface-raised">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl p-3 focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{summary}</span>
        <ChevronDown
          aria-hidden
          className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
        <span className="sr-only">{t("details")}</span>
      </summary>

      <div className="flex flex-col gap-4 px-3 pb-4">
        {template && (
          <>
            {(longName || template.description) && (
              <div className="flex flex-col gap-1">
                {longName && <p className="font-semibold">{libraryName}</p>}
                <p className="text-sm text-muted">{template.description[locale]}</p>
              </div>
            )}

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("stepsTitle")}</h3>
              <WorkoutSteps steps={template.steps} sport={template.sport} locale={locale} />
            </section>

            {sport && sport !== "strength" && (
              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("zonesTitle")}</h3>
                <ul className="flex flex-col gap-1.5">
                  {usedZones(template.steps).map((zone) => (
                    <li key={zone} className="flex items-center gap-2 text-sm">
                      <ZoneBadge zone={zone} />
                      <span className="text-muted">{zoneDescription(sport, zone, locale)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        {workout.notes && (
          <section className="flex flex-col gap-1 rounded-xl bg-accent/10 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-accent">{t("whyTitle")}</h3>
            <p className="text-sm">{workout.notes}</p>
          </section>
        )}
      </div>
    </details>
  );
}
