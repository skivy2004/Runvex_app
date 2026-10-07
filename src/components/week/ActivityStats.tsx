import { Activity as ActivityIcon, Heart, Mountain, Zap } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import type { Activity } from "@/services/activities";
import { DeleteActivityButton } from "./DeleteActivityButton";

/** "5:42" for 342 seconds. */
function minutesSeconds(totalSeconds: number) {
  const rounded = Math.round(totalSeconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

/**
 * What your watch recorded for a training: time, distance, pace or speed, and
 * heart rate, power and climbing when the file has them.
 */
export function ActivityStats({ activity }: { activity: Activity }) {
  const t = useTranslations("Activities");
  const format = useFormatter();
  const formatDuration = useFormatDuration();
  const formatDistance = useFormatDistance();

  const seconds = activity.duration_seconds;
  const meters = activity.distance_meters;
  // The usual speed per sport: min/km running, min/100 m swimming, km/h cycling.
  const speed =
    meters && meters > 0
      ? activity.sport === "running"
        ? t("pacePerKm", { pace: minutesSeconds(seconds / (meters / 1000)) })
        : activity.sport === "swimming"
          ? t("pacePer100", { pace: minutesSeconds(seconds / (meters / 100)) })
          : activity.sport === "cycling"
            ? t("speed", { speed: format.number(meters / 1000 / (seconds / 3600), { maximumFractionDigits: 1 }) })
            : null
      : null;

  const items = [
    { icon: ActivityIcon, text: formatDuration(Math.round(seconds / 60)) },
    meters ? { icon: null, text: formatDistance(meters, activity.sport) } : null,
    speed ? { icon: null, text: speed } : null,
    activity.avg_heart_rate ? { icon: Heart, text: t("heartRate", { bpm: activity.avg_heart_rate }) } : null,
    activity.avg_power ? { icon: Zap, text: t("power", { watts: activity.avg_power }) } : null,
    activity.ascent_meters ? { icon: Mountain, text: t("ascent", { meters: activity.ascent_meters }) } : null,
  ].filter((item) => item !== null);

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-blue-light/20 bg-blue/15 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-light">{t("recorded")}</h3>
        <DeleteActivityButton id={activity.id} />
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-1">
            {Icon && <Icon aria-hidden className="size-3.5 text-muted" />}
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
