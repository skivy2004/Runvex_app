import { useTranslations } from "next-intl";

/** Returns a function that turns 90 into "1 h 30 min" (or "1 u 30 min" in Dutch). */
export function useFormatDuration() {
  const t = useTranslations("Duration");

  return (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return t("minutes", { minutes });
    if (minutes === 0) return t("hours", { hours });
    return t("hoursMinutes", { hours, minutes });
  };
}
