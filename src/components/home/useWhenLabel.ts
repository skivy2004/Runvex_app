import { useFormatter, useTranslations } from "next-intl";
import { daysBetween, toFormattableDate } from "@/core/dates";

/** "Today", "Tomorrow" or a short date like "Fri 12 Jul", for a training's day. */
export function useWhenLabel(today: string) {
  const t = useTranslations("Home");
  const format = useFormatter();
  return (date: string) => {
    const days = daysBetween(today, date);
    if (days === 0) return t("today");
    if (days === 1) return t("tomorrow");
    return format.dateTime(toFormattableDate(date), { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  };
}
