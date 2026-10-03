import { CalendarDays, ListRestart, UserPen, Waves } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useFormatDuration } from "@/components/useFormatDuration";
import { toFormattableDate } from "@/core/dates";
import { equipmentNames, type Equipment, type PoolLength } from "@/core/workouts/swim";
import { SettingsLink } from "./SettingsLink";

type ProfileSettingsProps = {
  displayName: string | null;
  dateOfBirth: string | null;
  /** Available minutes per weekday, index 0 = Monday. */
  availability: number[];
  /** Only for swimmers: their pool and equipment. */
  swim: { poolLength: PoolLength; equipment: Equipment[] } | null;
};

/** The list of things you can change, each showing its current value. */
export function ProfileSettings({ displayName, dateOfBirth, availability, swim }: ProfileSettingsProps) {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const format = useFormatter();
  const formatDuration = useFormatDuration();

  const detailsText = [
    displayName,
    dateOfBirth && format.dateTime(toFormattableDate(dateOfBirth), { dateStyle: "long", timeZone: "UTC" }),
  ]
    .filter(Boolean)
    .join(" · ");

  const trainingDays = availability.filter((minutes) => minutes > 0).length;
  const totalMinutes = availability.reduce((sum, minutes) => sum + minutes, 0);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted">{t("settings")}</h2>
      <SettingsLink href="/profile/details" icon={UserPen} title={t("details")} description={detailsText} />
      <SettingsLink
        href="/profile/availability"
        icon={CalendarDays}
        title={t("trainingDays")}
        description={t("trainingDaysSummary", { days: trainingDays, total: formatDuration(totalMinutes) })}
      />
      {swim && (
        <SettingsLink
          href="/profile/swimming"
          icon={Waves}
          title={t("swimming")}
          description={[
            t("poolSummary", { length: swim.poolLength }),
            ...swim.equipment.map((item) => equipmentNames[item][locale]),
          ].join(" · ")}
        />
      )}
      <SettingsLink
        href="/intake"
        icon={ListRestart}
        title={t("redoIntake")}
        description={t("redoIntakeText")}
      />
    </section>
  );
}
