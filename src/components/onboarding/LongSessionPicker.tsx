"use client";

import { useTranslations } from "next-intl";
import {
  dayAllowsSport,
  longSessionDay,
  longSessionSports,
  setLongSessionDay,
  type DayAvailability,
} from "@/core/availability";
import { weekdays, type Sport } from "@/core/training";

type LongSessionPickerProps = {
  week: DayAvailability[];
  onChange: (week: DayAvailability[]) => void;
  /** The user's sports; only running and cycling get a long session. */
  userSports: Sport[];
};

/** Choose the weekday for the long run and the long ride. */
export function LongSessionPicker({ week, onChange, userSports }: LongSessionPickerProps) {
  const t = useTranslations("Onboarding.availability");
  const tLong = useTranslations("LongSessions");
  const tShort = useTranslations("WeekdaysShort");
  const tWeekdays = useTranslations("Weekdays");

  const sports = longSessionSports.filter((sport) => userSports.includes(sport));
  if (sports.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-[1.75rem] border border-white/[0.08] bg-surface/70 backdrop-blur-xl p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">{t("longSessionsTitle")}</h2>
        <p className="text-sm text-muted">{t("longSessionsText")}</p>
      </div>

      {sports.map((sport) => {
        const selectedDay = longSessionDay(week, sport);
        const hasEligibleDay = week.some((day) => dayAllowsSport(day, sport));

        return (
          <fieldset key={sport} className="flex flex-col gap-2">
            <legend className="mb-2 flex w-full items-center justify-between text-sm font-medium">
              {tLong(sport)}
              {/* Required: shown until a day is chosen. */}
              {selectedDay === null && (
                <span className="text-xs font-normal text-warning">{t("longSessionRequired")}</span>
              )}
            </legend>
            {hasEligibleDay ? (
              <div className="grid grid-cols-7 gap-1.5">
                {weekdays.map((weekday, index) => {
                  const isAllowed = dayAllowsSport(week[index], sport);
                  const isSelected = selectedDay === index;
                  return (
                    <button
                      key={weekday}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={tWeekdays(weekday)}
                      disabled={!isAllowed}
                      // Tapping the selected day again removes the long session.
                      onClick={() => onChange(setLongSessionDay(week, sport, isSelected ? null : index))}
                      className={`flex h-10 items-center justify-center rounded-full text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-raised text-muted enabled:hover:text-foreground"
                      }`}
                    >
                      {tShort(weekday)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">{t("noLongSessionDay")}</p>
            )}
          </fieldset>
        );
      })}
    </section>
  );
}
