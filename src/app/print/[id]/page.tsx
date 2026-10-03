import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { BackLink } from "@/components/profile/BackLink";
import { PrintButton } from "@/components/week/PrintButton";
import { SwimPrintCard } from "@/components/week/SwimPrintCard";
import { startOfWeek, toFormattableDate } from "@/core/dates";
import { getWorkout } from "@/core/workouts/library";
import { getRequestClient, getRequestProfile } from "@/lib/currentUser";
import { getPlannedWorkout } from "@/services/workouts";

// A small card with one swim training, to print, cut out and stick on your water
// bottle. Outside the (app) layout, so there's no tab bar on the page.
export default async function PrintWorkoutPage({ params }: PageProps<"/print/[id]">) {
  const t = await getTranslations("Print");
  const tWeek = await getTranslations("Week");
  const locale = await getLocale();
  const format = await getFormatter();
  const supabase = await getRequestClient();
  const profile = await getRequestProfile();
  if (!profile) return null;

  const { id } = await params;
  // Only your own trainings: the database (RLS) doesn't return anyone else's.
  const planned = /^[0-9a-f-]{36}$/.test(id) ? await getPlannedWorkout(supabase, profile.id, id) : null;
  const workout = planned?.template_id ? getWorkout(planned.template_id) : undefined;
  if (!planned || !workout?.swim) notFound();

  const date = format.dateTime(toFormattableDate(planned.scheduled_on), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-5 py-6">
      <div className="print-hidden flex flex-col gap-4">
        <BackLink href={`/week?week=${startOfWeek(planned.scheduled_on)}`} label={tWeek("title")} />
        <p className="text-sm text-muted">{t("intro")}</p>
      </div>

      <SwimPrintCard workout={workout} swim={workout.swim} date={date} locale={locale} />

      <div className="print-hidden flex flex-col gap-2">
        <PrintButton />
        <p className="text-xs text-muted">{t("tip")}</p>
      </div>
    </div>
  );
}
