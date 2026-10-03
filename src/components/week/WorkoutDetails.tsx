import { useTranslations } from "next-intl";
import type { Locale } from "@/core/locale";
import type { Sport } from "@/core/training";
import { equipmentNames, swimDrills, usedEquipment, type DrillId } from "@/core/workouts/swim";
import type { SwimInfo, WorkoutStep, Zone } from "@/core/workouts/types";
import { WorkoutSteps, ZoneBadge } from "./WorkoutSteps";

/** Everything needed to show a whole workout. Plain data, so the browser can show it too. */
export type WorkoutDetailsData = {
  description: string;
  sport: Sport;
  steps: WorkoutStep[];
  zones: { zone: Zone; text: string }[];
  /** Swim trainings built from blocks: shown per section, with equipment and drills. */
  swim?: SwimInfo;
};

/** The drills used in these steps, in order of appearance. */
function usedDrills(steps: WorkoutStep[]): DrillId[] {
  const drills: DrillId[] = [];
  const collect = (list: WorkoutStep[]) => {
    for (const step of list) {
      if (step.type === "repeat") collect(step.steps);
      else if (step.drill && !drills.includes(step.drill)) drills.push(step.drill);
    }
  };
  collect(steps);
  return drills;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const headingClass = "text-xs font-semibold uppercase tracking-wide text-muted";

type WorkoutDetailsProps = WorkoutDetailsData & { locale: Locale };

/** The whole workout: description, the steps with zones, and what each zone means. */
export function WorkoutDetails({ description, sport, steps, zones, swim, locale }: WorkoutDetailsProps) {
  const t = useTranslations("Workout");
  const equipment = usedEquipment(steps);
  const drills = usedDrills(steps);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{description}</p>

      {equipment.length > 0 && (
        <section className="flex flex-wrap items-center gap-1.5">
          <h3 className={headingClass}>{t("bring")}</h3>
          {equipment.map((item) => (
            <span key={item} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-sm font-semibold text-accent">
              {equipmentNames[item][locale]}
            </span>
          ))}
        </section>
      )}

      {swim ? (
        // A block swim: warm-up, technique, endurance, speed and cool-down, each with its name.
        swim.sections.map((section) => (
          <section key={section.section} className="flex flex-col gap-2">
            <h3 className={headingClass}>
              {t(`swimSection.${section.section}`)} · <span className="normal-case">{section.name[locale]}</span>
            </h3>
            <WorkoutSteps steps={section.steps} sport={sport} locale={locale} />
          </section>
        ))
      ) : (
        <section className="flex flex-col gap-2">
          <h3 className={headingClass}>{t("stepsTitle")}</h3>
          <WorkoutSteps steps={steps} sport={sport} locale={locale} />
        </section>
      )}

      {drills.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className={headingClass}>{t("drillsTitle")}</h3>
          <ul className="flex flex-col gap-2">
            {drills.map((id) => (
              <li key={id} className="text-sm">
                <span className="font-semibold">{capitalize(swimDrills[id].name[locale])}</span>
                <span className="text-muted">: {swimDrills[id].howTo[locale]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
