import { Flag, Pencil } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { SeasonTimeline } from "@/components/season/SeasonTimeline";
import { SeasonWeekCard } from "@/components/season/SeasonWeekCard";
import { SportIcon } from "@/components/SportIcon";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { daysBetween, startOfWeek, toFormattableDate, todayInTimeZone } from "@/core/dates";
import { findPreset } from "@/core/racePresets";
import { getRequestClient, getRequestProfile } from "@/lib/currentUser";
import { getCurrentGoal } from "@/services/goals";
import { loadSeason } from "@/services/season";

/** Your goal and the training blocks towards it, over the whole season. */
export default async function GoalPage() {
  const t = await getTranslations("Goal");
  const tSeason = await getTranslations("Season");
  const tSports = await getTranslations("Sports");
  const tPresets = await getTranslations("RacePresets");
  const format = await getFormatter();
  const supabase = await getRequestClient();
  const profile = await getRequestProfile();
  if (!profile) return null;

  const today = todayInTimeZone(profile.timezone);
  const thisWeek = startOfWeek(today);
  const [goal, season] = await Promise.all([getCurrentGoal(supabase, profile.id, today), loadSeason(supabase, profile.id, today)]);
  const current = season.weekFor(thisWeek);
  const preset = findPreset(goal?.race_preset ?? null);
  const weeksToGo = goal?.event_date ? Math.max(0, Math.ceil(daysBetween(today, goal.event_date) / 7)) : null;
  const distance = (meters: number) =>
    meters >= 1000 ? `${format.number(meters / 1000, { maximumFractionDigits: 1 })} km` : `${format.number(meters)} m`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading eyebrow={t("eyebrow")} title={t("title")} />

      {goal ? (
        <Card className="flex flex-col gap-4 bg-gradient-to-br from-blue/25 via-surface/70 to-coral/15">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              {preset && <p className="eyebrow">{tPresets(`${preset.key}.description`)}</p>}
              <h2 className="text-2xl font-bold tracking-tight">{goal.event_name ?? goal.description}</h2>
              {goal.event_date && (
                <p className="text-sm text-muted">
                  {format.dateTime(toFormattableDate(goal.event_date), { dateStyle: "long", timeZone: "UTC" })}
                  {weeksToGo !== null && ` · ${t("weeksToGo", { weeks: weeksToGo })}`}
                </p>
              )}
            </div>
            <Link href="/intake" prefetch aria-label={t("edit")} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-muted hover:text-foreground">
              <Pencil aria-hidden className="size-4" />
            </Link>
          </div>
          {goal.segments.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {goal.segments.map((segment, index) => (
                <li key={index} className="flex items-center gap-2 rounded-xl bg-white/[0.05] py-1.5 pr-3 pl-1.5 text-sm font-bold">
                  <SportIcon sport={segment.sport} small />
                  <span className="sr-only">{tSports(segment.sport)}</span>
                  {distance(segment.distanceMeters)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <Link href="/intake" prefetch className="flex items-center gap-3 rounded-[1.75rem] border border-white/[0.08] bg-surface/70 p-5 backdrop-blur-xl">
          <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <Flag className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="font-bold">{t("noGoal")}</span>
            <span className="text-sm text-muted">{t("noGoalText")}</span>
          </span>
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeading eyebrow={t("thisWeek")} title={tSeason("title")} />
        <SeasonWeekCard week={current} canChange isOverride={season.recoveryWeeks.includes(thisWeek)} />
      </section>

      {season.plan ? (
        <section className="flex flex-col gap-3">
          <SectionHeading eyebrow={t("seasonEyebrow")} title={t("seasonTitle")} />
          <Card>
            <SeasonTimeline weeks={season.plan} currentWeek={thisWeek} />
          </Card>
          <p className="px-1 text-sm leading-relaxed text-muted">{t("seasonText")}</p>
          <p className="px-1 text-sm leading-relaxed text-muted">{t("maxWeek", { hours: season.maxWeeklyMinutes / 60 })}</p>
        </section>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="px-1 text-sm leading-relaxed text-muted">{t("maintainText")}</p>
          <p className="px-1 text-sm leading-relaxed text-muted">{t("maxWeek", { hours: season.maxWeeklyMinutes / 60 })}</p>
        </div>
      )}
    </div>
  );
}
