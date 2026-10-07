import { Moon, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { SportIcon } from "@/components/SportIcon";
import { useFormatDuration } from "@/components/useFormatDuration";
import { toFormattableDate } from "@/core/dates";
import type { LongSessionSport } from "@/core/availability";
import type { Sport } from "@/core/training";
import { getWorkout } from "@/core/workouts/library";
import type { Activity } from "@/services/activities";
import type { PlannedWorkout } from "@/services/workouts";
import { ActivityStats } from "./ActivityStats";
import { DraggableWorkout, DroppableDay } from "./WeekDragAndDrop";
import { parseSwimWorkoutId } from "@/core/workouts/swimTraining";
import { WorkoutActions, type Alternative } from "./WorkoutActions";
import { WorkoutCard } from "./WorkoutCard";

/** Turns on changing trainings: swap, move, delete, drag and add. */
export type DayEditing = {
  /** The 7 dates of the shown week. */
  weekDates: string[];
  alternativesFor: (workout: PlannedWorkout, isLongSession: boolean) => Alternative[];
};

type DayCardProps = {
  date: string;
  availableMinutes: number;
  /** Sports the user wants to do on this weekday (empty = flexible). */
  preferredSports?: Sport[];
  /** Long run / long ride planned on this weekday. */
  longSessions?: LongSessionSport[];
  workouts: PlannedWorkout[];
  /** Uploaded activities of this day: shown in their training, or as an extra one. */
  activities?: Activity[];
  isToday: boolean;
  isPast: boolean;
  /** True once the week has trainings: an empty day is then a rest day, not "not planned yet". */
  weekIsPlanned: boolean;
  editing?: DayEditing;
};

export function DayCard({
  date,
  availableMinutes,
  preferredSports = [],
  longSessions = [],
  workouts,
  activities = [],
  isToday,
  isPast,
  weekIsPlanned,
  editing,
}: DayCardProps) {
  const t = useTranslations("Week");
  const tSports = useTranslations("Sports");
  const tLong = useTranslations("LongSessions");
  const format = useFormatter();
  const locale = useLocale();
  const formatDuration = useFormatDuration();

  // The first workout of a long session's sport on this day is that long session.
  // Its card is then called "Long run" / "Long ride", so the separate label can go.
  const longSessionWorkouts = new Set(
    longSessions.flatMap((sport) => workouts.find((workout) => workout.sport === sport)?.id ?? []),
  );
  const openLongSessions = longSessions.filter(
    (sport) => !workouts.some((workout) => workout.sport === sport),
  );

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

  const card = (
    // The day itself, as a card. While editing it's wrapped in a drop zone below.
    <section
      // aria-current tells screen readers which day is today.
      aria-current={isToday ? "date" : undefined}
      className={`flex flex-col gap-3 rounded-[1.75rem] border p-4 backdrop-blur-xl ${
        isToday
          ? "border-accent/60 bg-accent/[0.06] shadow-[0_0_30px_rgb(239_106_69/0.12)]"
          : "border-white/[0.08] bg-surface/70"
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
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
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

      {!isRestDay && openLongSessions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {openLongSessions.map((sport) => (
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
          {workouts.map((workout) => {
            const isLongSession = longSessionWorkouts.has(workout.id);
            // A training you did stays as it was: only deleting is still possible.
            const isDone = workout.status === "done";
            const workoutCard = (
              <WorkoutCard
                workout={workout}
                activity={activities.find((activity) => activity.planned_workout_id === workout.id)}
                isLongSession={isLongSession}
                canCheckOff={isPast || isToday}
                actions={
                  editing && (
                    <WorkoutActions
                      workoutId={workout.id}
                      date={date}
                      weekDates={editing.weekDates}
                      alternatives={isDone ? [] : editing.alternativesFor(workout, isLongSession)}
                      poolLength={
                        !isDone && workout.template_id
                          ? (parseSwimWorkoutId(workout.template_id)?.poolLength ?? null)
                          : null
                      }
                      canMove={!isDone}
                    />
                  )
                }
              />
            );
            // The same name as on the card, for the drag handle's label.
            const name =
              isLongSession && (workout.sport === "running" || workout.sport === "cycling")
                ? tLong(workout.sport)
                : (workout.template_id && getWorkout(workout.template_id)?.name[locale]) || workout.title;
            return (
              <li key={workout.id}>
                {editing && !isDone ? (
                  <DraggableWorkout id={workout.id} date={date} name={name}>
                    {workoutCard}
                  </DraggableWorkout>
                ) : (
                  workoutCard
                )}
              </li>
            );
          })}
        </ul>
      ) : activities.length > 0 ? null : (
        // Nothing planned and nothing done: a rest day (or not planned yet).
        isRestDay || (weekIsPlanned && openLongSessions.length === 0) ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Moon aria-hidden className="size-4 shrink-0 text-blue-light" />
            <span>
              <span className="font-semibold text-foreground">{t("restDayNothing")}</span>
              {" · "}
              {t("restDayText")}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted">{t("noTraining")}</p>
        )
      )}

      {activities.some((activity) => activity.planned_workout_id === null) && (
        <ul className="flex flex-col gap-2">
          {activities
            .filter((activity) => activity.planned_workout_id === null)
            .map((activity) => (
              <li key={activity.id} className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <SportIcon sport={activity.sport} small />
                  {t("extraActivity", { sport: tSports(activity.sport) })}
                </span>
                <ActivityStats activity={activity} />
              </li>
            ))}
        </ul>
      )}

      {warning && (
        <p className="flex items-center gap-1.5 text-sm text-warning">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {warning}
        </p>
      )}

      {editing && !isPast && (
        <Link
          href={`/add?date=${date}`}
          className="flex items-center gap-1.5 self-start rounded-full px-1 text-sm font-semibold text-accent hover:underline"
        >
          <Plus aria-hidden className="size-4" />
          {t("addTraining")}
        </Link>
      )}
    </section>
  );

  // While editing, the whole day is a drop zone for dragged trainings.
  return editing ? <DroppableDay date={date}>{card}</DroppableDay> : card;
}
