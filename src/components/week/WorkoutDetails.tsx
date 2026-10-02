import { useTranslations } from "next-intl";
import type { Locale } from "@/core/locale";
import type { Sport } from "@/core/training";
import type { WorkoutStep, Zone } from "@/core/workouts/types";
import { WorkoutSteps, ZoneBadge } from "./WorkoutSteps";

/** Everything needed to show a whole workout. Plain data, so the browser can show it too. */
export type WorkoutDetailsData = {
  description: string;
  sport: Sport;
  steps: WorkoutStep[];
  zones: { zone: Zone; text: string }[];
};

type WorkoutDetailsProps = WorkoutDetailsData & { locale: Locale };

/** The whole workout: description, the steps with zones, and what each zone means. */
export function WorkoutDetails({ description, sport, steps, zones, locale }: WorkoutDetailsProps) {
  const t = useTranslations("Workout");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{description}</p>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("stepsTitle")}</h3>
        <WorkoutSteps steps={steps} sport={sport} locale={locale} />
      </section>

      {zones.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{t("zonesTitle")}</h3>
          <ul className="flex flex-col gap-1.5">
            {zones.map(({ zone, text }) => (
              <li key={zone} className="flex items-center gap-2 text-sm">
                <ZoneBadge zone={zone} />
                <span className="text-muted">{text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
