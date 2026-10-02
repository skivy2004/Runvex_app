import { getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { AvailabilityForm } from "@/components/profile/AvailabilityForm";
import { BackLink } from "@/components/profile/BackLink";
import { getAthleteSports } from "@/services/athleteSports";
import { getRequestClient, getRequestProfile } from "@/lib/currentUser";
import { getWeeklyAvailability } from "@/services/availability";

export default async function AvailabilitySettingsPage() {
  const t = await getTranslations("Profile");
  const supabase = await getRequestClient();
  const profile = await getRequestProfile();
  if (!profile) return null;

  const [week, athleteSports] = await Promise.all([
    getWeeklyAvailability(supabase, profile.id),
    getAthleteSports(supabase, profile.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/profile" label={t("title")} />
      <PageHeading title={t("trainingDays")} subtitle={t("trainingDaysText")} />
      <AvailabilityForm
        initialWeek={week}
        sportOptions={athleteSports.map((item) => item.sport)}
      />
    </div>
  );
}
