import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { SportIcon } from "@/components/SportIcon";
import { useFormatDuration } from "@/components/useFormatDuration";
import type { PlannedWorkout } from "@/services/workouts";

type WorkoutRowProps = {
  workout: Pick<PlannedWorkout, "title" | "sport" | "duration_minutes">;
  /** Optional content on the right, e.g. "Tomorrow". */
  trailing?: ReactNode;
};

/** One training as a row: sport icon, title, sport and duration. */
export function WorkoutRow({ workout, trailing }: WorkoutRowProps) {
  const tSports = useTranslations("Sports");
  const formatDuration = useFormatDuration();

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-raised p-3">
      <SportIcon sport={workout.sport} />
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate font-semibold">{workout.title}</p>
        <p className="text-sm text-muted">
          {tSports(workout.sport)} · {formatDuration(workout.duration_minutes)}
        </p>
      </div>
      {trailing}
    </div>
  );
}
