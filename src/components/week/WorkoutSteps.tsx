import { useTranslations } from "next-intl";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import type { Locale } from "@/core/locale";
import type { Sport } from "@/core/training";
import type { WorkoutStep, Zone } from "@/core/workouts/types";

/** Easy zones in the accent color, tempo in yellow, hard in red. */
const zoneClasses: Record<Zone, string> = {
  1: "bg-accent/10 text-accent",
  2: "bg-accent/20 text-accent",
  3: "bg-warning/15 text-warning",
  4: "bg-danger/15 text-danger",
  5: "bg-danger/25 text-danger",
};

export function ZoneBadge({ zone }: { zone: Zone }) {
  const t = useTranslations("Workout");
  return (
    <span
      className={`inline-flex h-6 min-w-9 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold ${zoneClasses[zone]}`}
    >
      {t("zone", { zone })}
    </span>
  );
}

type WorkoutStepsProps = {
  steps: WorkoutStep[];
  sport: Sport;
  locale: Locale;
};

/** The structure of a workout: warm-up, blocks with zones, repeats and cool-down. */
export function WorkoutSteps({ steps, sport, locale }: WorkoutStepsProps) {
  const t = useTranslations("Workout");
  const formatDuration = useFormatDuration();
  const formatDistance = useFormatDistance();

  return (
    <ol className="flex flex-col gap-1.5">
      {steps.map((step, index) => {
        if (step.type === "repeat") {
          return (
            <li key={index} className="flex flex-col gap-1.5">
              <p className="text-sm font-semibold">{t("repeat", { times: step.times })}</p>
              {/* The repeated steps, indented with a line to show they belong together. */}
              <div className="border-l-2 border-line pl-3">
                <WorkoutSteps steps={step.steps} sport={sport} locale={locale} />
              </div>
            </li>
          );
        }

        const length =
          step.durationMinutes !== null
            ? formatDuration(step.durationMinutes)
            : formatDistance(step.distanceMeters ?? 0, sport);
        const name =
          step.type === "warmup"
            ? t("warmup")
            : step.type === "cooldown"
              ? t("cooldown")
              : (step.label?.[locale] ?? null);

        return (
          <li key={index} className="flex items-center gap-2 text-sm">
            <ZoneBadge zone={step.zone} />
            <span className="font-semibold">{length}</span>
            {name && <span className="text-muted first-letter:uppercase">{name}</span>}
            {step.isWalking && <span className="text-muted">· {t("walk")}</span>}
            {step.restSeconds !== null && (
              <span className="text-muted">· {t("rest", { seconds: step.restSeconds })}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** All zones used in a workout, lowest first. */
export function usedZones(steps: WorkoutStep[]): Zone[] {
  const zones = new Set<Zone>();
  const collect = (list: WorkoutStep[]) => {
    for (const step of list) {
      if (step.type === "repeat") collect(step.steps);
      else zones.add(step.zone);
    }
  };
  collect(steps);
  return [...zones].sort();
}
