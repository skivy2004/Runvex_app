import type { Locale } from "@/core/locale";
import { equipmentNames, strokeNames, swimDrills, type Equipment } from "./swim";
import type { SwimSection } from "./swimBlocks";
import type { WorkoutStep } from "./types";

// A swim training as a coach's schedule, to print and stick on your water bottle:
// one line per set, the rest in its own column, and the meters per block.
//
//   Kern 1   3 × 50m (25m hondjes + 25m BC) met zoomers   r10"   300m

/** Section names as on a schedule. */
export const sectionNames: Record<SwimSection, Record<Locale, string>> = {
  warmup: { nl: "Inz.", en: "Warm-up" },
  technique: { nl: "Kern 1", en: "Main 1" },
  main: { nl: "Kern 2", en: "Main 2" },
  speed: { nl: "Kern 3", en: "Main 3" },
  cooldown: { nl: "Uitz.", en: "Cool-down" },
};

export type PrintLine = {
  /** The set, e.g. "4 × 200m BC Z2 met pullbuoy". */
  text: string;
  /** Rest after the set (after each repeat), in seconds. */
  restSeconds: number | null;
};

type SingleStep = Exclude<WorkoutStep, { type: "repeat" }>;

const andWord: Record<Locale, string> = { nl: "en", en: "and" };
const withWord: Record<Locale, string> = { nl: "met", en: "with" };

/** "met zoomers en snorkel" */
function withEquipment(items: Equipment[], locale: Locale): string {
  if (items.length === 0) return "";
  const names = items.map((item) => equipmentNames[item][locale]);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} ${andWord[locale]} ${names.at(-1)}`;
  return ` ${withWord[locale]} ${list}`;
}

/** "25m hondjes" or "200m BC Z2" (zone 1 is the default and left out). */
function stepText(step: SingleStep, locale: Locale): string {
  const name = step.drill
    ? swimDrills[step.drill].name[locale]
    : step.stroke
      ? strokeNames[step.stroke].short[locale]
      : "";
  const zone = step.zone > 1 ? ` Z${step.zone}` : "";
  return `${step.distanceMeters ?? 0}m${name ? ` ${name}` : ""}${zone}`;
}

function singleSteps(steps: WorkoutStep[]): SingleStep[] {
  return steps.flatMap((step) => (step.type === "repeat" ? singleSteps(step.steps) : [step]));
}

function equipmentOf(steps: SingleStep[]): Equipment[] {
  return [...new Set(steps.flatMap((step) => step.equipment))];
}

/** The meters of these steps, counting repeats. */
export function stepsMeters(steps: WorkoutStep[]): number {
  return steps.reduce(
    (total, step) =>
      total + (step.type === "repeat" ? step.times * stepsMeters(step.steps) : (step.distanceMeters ?? 0)),
    0,
  );
}

/** One line per set, like "3 × 50m (25m hondjes + 25m BC) met zoomers" with its rest. */
export function printLines(steps: WorkoutStep[], locale: Locale): PrintLine[] {
  return steps.map((step) => {
    if (step.type !== "repeat") {
      return {
        text: `${stepText(step, locale)}${withEquipment(step.equipment, locale)}`,
        restSeconds: step.restSeconds,
      };
    }
    const inner = singleSteps(step.steps);
    const last = inner[inner.length - 1];
    const body =
      inner.length === 1
        ? stepText(inner[0], locale)
        : `${stepsMeters(step.steps)}m (${inner.map((child) => stepText(child, locale)).join(" + ")})`;
    return {
      text: `${step.times} × ${body}${withEquipment(equipmentOf(inner), locale)}`,
      restSeconds: last?.restSeconds ?? null,
    };
  });
}
