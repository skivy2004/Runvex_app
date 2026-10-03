import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SportIcon } from "@/components/SportIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import { WorkoutCard } from "@/components/week/WorkoutCard";
import { getWorkout } from "@/core/workouts/library";
import type { PlannedWorkout } from "@/services/workouts";
import { useWhenLabel } from "./useWhenLabel";

type ComingUpProps = {
  workouts: PlannedWorkout[];
  today: string;
};

/** The trainings after the next one, as cards you swipe through. Each opens the whole training. */
export function ComingUp({ workouts, today }: ComingUpProps) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const formatDistance = useFormatDistance();
  const whenLabel = useWhenLabel(today);

  if (workouts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading title={t("comingUp")} />
      {/* Full width of the screen, so cards scroll out of view at the edge. */}
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {workouts.map((workout) => {
          const template = workout.template_id ? getWorkout(workout.template_id) : undefined;
          const name = template?.name[locale] ?? workout.title;
          const length = [
            template?.distanceMeters ? formatDistance(template.distanceMeters, template.sport) : null,
            formatDuration(workout.duration_minutes),
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={workout.id} className="w-[72%] shrink-0 snap-start">
              <WorkoutCard
                workout={workout}
                triggerClassName="flex h-full w-full flex-col gap-4 rounded-[1.75rem] border border-white/[0.08] bg-surface/70 p-5 text-left backdrop-blur-xl transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-accent"
                trigger={
                  <>
                    <span className="eyebrow">{whenLabel(workout.scheduled_on)}</span>
                    <SportIcon sport={workout.sport} className="!size-12" />
                    <span className="flex items-end justify-between gap-2">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-lg font-bold">{name}</span>
                        <span className="text-sm text-muted">{length}</span>
                      </span>
                      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10">
                        <ChevronRight className="size-4" />
                      </span>
                    </span>
                  </>
                }
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
