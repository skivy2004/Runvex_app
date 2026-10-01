import { useFormatter, useTranslations } from "next-intl";
import { distanceUnit } from "@/core/racePresets";
import type { Sport } from "@/core/training";

/** Returns a function that turns 21098 into "21.1 km" (or "21,1 km" in Dutch). */
export function useFormatDistance() {
  const t = useTranslations("Distance");
  const format = useFormatter();

  return (meters: number) =>
    meters < 1000
      ? t("meters", { value: format.number(meters) })
      : t("kilometers", { value: format.number(meters / 1000, { maximumFractionDigits: 1 }) });
}

/**
 * Returns a function that turns meters into the text shown in a distance field:
 * meters for swimming ("1900"), kilometers for the rest ("21,098" in Dutch).
 */
export function useDistanceInputValue() {
  const format = useFormatter();

  return (sport: Sport, meters: number) =>
    distanceUnit(sport) === "m"
      ? String(meters)
      : format.number(meters / 1000, { maximumFractionDigits: 3, useGrouping: false });
}
