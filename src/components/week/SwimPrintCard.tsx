import { useTranslations } from "next-intl";
import { Logo } from "@/components/Logo";
import type { Locale } from "@/core/locale";
import { printLines, sectionNames, stepsMeters } from "@/core/workouts/printCard";
import { equipmentNames, usedEquipment } from "@/core/workouts/swim";
import type { SwimInfo, Workout } from "@/core/workouts/types";

type SwimPrintCardProps = {
  workout: Workout;
  /** The blocks of the swim (workout.swim). */
  swim: SwimInfo;
  /** The day, already formatted, e.g. "za 3 okt". */
  date: string;
  locale: Locale;
};

const cell = "border border-line px-2 py-1";

/**
 * One swim training laid out like a coach's schedule: per block one line per set,
 * the rest in its own column and the meters per block, with the total at the bottom.
 */
export function SwimPrintCard({ workout, swim, date, locale }: SwimPrintCardProps) {
  const t = useTranslations("Print");
  const equipment = usedEquipment(workout.steps);
  // The accent of the training: the names of its technique, endurance and speed blocks.
  const accent = swim.sections
    .filter((section) => ["technique", "main", "speed"].includes(section.section))
    .map((section) => section.name[locale])
    .join(", ");

  return (
    // About 13 cm wide on paper, with a dashed line to cut along.
    <article className="print-card flex w-full max-w-[13cm] flex-col gap-2 rounded-xl border-2 border-dashed border-line p-3">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold leading-tight">
            {date} · {t("pool", { length: swim.poolLength })}
          </p>
          <p className="text-xs">
            <span className="font-semibold">{t("accent")}:</span> {accent}
          </p>
          {equipment.length > 0 && (
            <p className="text-xs">
              <span className="font-semibold">{t("bring")}:</span>{" "}
              {equipment.map((item) => equipmentNames[item][locale]).join(", ")}
            </p>
          )}
        </div>
        <Logo className="shrink-0 text-xs" />
      </header>

      <table className="w-full border-collapse text-[12px] leading-snug">
        <thead>
          <tr className="text-left">
            <th className={`${cell} w-14`} />
            <th className={cell}>{t("task")}</th>
            <th className={`${cell} w-11 text-center`}>{t("rest")}</th>
            <th className={`${cell} w-14 text-right`}>{t("total")}</th>
          </tr>
        </thead>
        <tbody>
          {swim.sections.map((section) => {
            const lines = printLines(section.steps, locale);
            return lines.map((line, index) => (
              <tr key={`${section.section}-${index}`} className="align-top">
                {index === 0 && (
                  <th scope="rowgroup" rowSpan={lines.length} className={`${cell} text-left font-bold`}>
                    {sectionNames[section.section][locale]}
                  </th>
                )}
                <td className={cell}>{line.text}</td>
                <td className={`${cell} text-center`}>{line.restSeconds ? `r${line.restSeconds}"` : ""}</td>
                {index === 0 && (
                  <td rowSpan={lines.length} className={`${cell} text-right font-semibold`}>
                    {stepsMeters(section.steps)}m
                  </td>
                )}
              </tr>
            ));
          })}
          <tr>
            <th scope="row" colSpan={3} className={`${cell} text-right`}>
              {t("total")}
            </th>
            <td className={`${cell} text-right font-bold`}>{workout.distanceMeters}m</td>
          </tr>
        </tbody>
      </table>

      <p className="text-[10px]">{t("legend")}</p>
    </article>
  );
}
