"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveAvailability } from "@/app/(app)/profile/actions";
import { DayAvailabilityCard } from "@/components/onboarding/DayAvailabilityCard";
import { LongSessionPicker } from "@/components/onboarding/LongSessionPicker";
import { Button } from "@/components/ui/Button";
import { useFormatDuration } from "@/components/useFormatDuration";
import { missingLongSessions, type DayAvailability } from "@/core/availability";
import { weekdays, type Sport } from "@/core/training";

type AvailabilityFormProps = {
  initialWeek: DayAvailability[];
  /** The user's sports, to choose from per day. */
  sportOptions: Sport[];
};

export function AvailabilityForm({ initialWeek, sportOptions }: AvailabilityFormProps) {
  const t = useTranslations("Profile");
  const tWeekdays = useTranslations("Weekdays");
  const tAvailability = useTranslations("Onboarding.availability");
  const formatDuration = useFormatDuration();
  const [week, setWeek] = useState(initialWeek);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const totalMinutes = week.reduce((sum, day) => sum + day.minutes, 0);
  // Runners need a long run day and cyclists a long ride day before saving.
  const isComplete = missingLongSessions(week, sportOptions).length === 0;

  function setDay(dayIndex: number, day: DayAvailability) {
    setWeek((current) => current.map((value, index) => (index === dayIndex ? day : value)));
  }

  function handleSave() {
    setSaveFailed(false);
    startSaving(async () => {
      // On success the action redirects back to the profile.
      const result = await saveAvailability(week);
      if (!result.ok) setSaveFailed(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {weekdays.map((weekday, index) => (
          <DayAvailabilityCard
            key={weekday}
            dayName={tWeekdays(weekday)}
            value={week[index]}
            onChange={(day) => setDay(index, day)}
            sportOptions={sportOptions}
          />
        ))}
      </div>
      <LongSessionPicker week={week} onChange={setWeek} userSports={sportOptions} />
      <p className="text-center text-sm text-muted">
        {tAvailability("total", { total: formatDuration(totalMinutes) })}
      </p>

      {saveFailed && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t("saveFailed")}
        </p>
      )}
      <Button fullWidth disabled={isSaving || !isComplete} onClick={handleSave}>
        {t("save")}
      </Button>
    </div>
  );
}
