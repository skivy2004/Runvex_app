"use client";

import { useTranslations } from "next-intl";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { TextField } from "@/components/ui/TextField";
import { useFormatDuration } from "@/components/useFormatDuration";
import { latestDateOfBirthForAge } from "@/core/age";
import type { DayAvailability } from "@/core/availability";
import { experienceLevels, sports, weekdays, workPatterns } from "@/core/training";
import { MIN_AGE } from "@/core/validation/onboarding";
import { DayAvailabilityCard } from "./DayAvailabilityCard";
import { isOldEnough, toggle, type OnboardingDraft } from "./draft";
import { LongSessionPicker } from "./LongSessionPicker";
import { StepHeading } from "./StepHeading";

// Every step gets the current answers and a function to change them.
type StepProps = {
  draft: OnboardingDraft;
  onChange: (changes: Partial<OnboardingDraft>) => void;
};

export function AboutStep({ draft, onChange }: StepProps) {
  const t = useTranslations("Onboarding.about");
  const showTooYoung = draft.dateOfBirth !== "" && !isOldEnough(draft.dateOfBirth);

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <TextField
        label={t("name")}
        hint={t("nameHint")}
        placeholder={t("namePlaceholder")}
        autoComplete="given-name"
        maxLength={80}
        value={draft.displayName}
        onChange={(event) => onChange({ displayName: event.target.value })}
      />
      <div className="flex flex-col gap-2">
        <TextField
          label={t("dateOfBirth")}
          type="date"
          autoComplete="bday"
          min="1900-01-01"
          max={latestDateOfBirthForAge(MIN_AGE)}
          value={draft.dateOfBirth}
          onChange={(event) => onChange({ dateOfBirth: event.target.value })}
        />
        {showTooYoung && (
          <p role="alert" className="text-sm text-danger">
            {t("tooYoung", { minAge: MIN_AGE })}
          </p>
        )}
      </div>
    </div>
  );
}

export function SportsStep({ draft, onChange }: StepProps) {
  const t = useTranslations("Onboarding.sports");
  const tSports = useTranslations("Sports");

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport) => (
          <ChoiceCard
            key={sport}
            kind="checkbox"
            title={tSports(sport)}
            selected={draft.sports.includes(sport)}
            onSelect={() => onChange({ sports: toggle(draft.sports, sport) })}
          />
        ))}
      </div>
    </div>
  );
}

export function LevelsStep({ draft, onChange }: StepProps) {
  const t = useTranslations("Onboarding.levels");
  const tSports = useTranslations("Sports");
  const tLevels = useTranslations("Levels");

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      {draft.sports.map((sport) => {
        const selectedLevel = draft.levels[sport];
        return (
          <fieldset key={sport} className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold">{tSports(sport)}</legend>
            <div role="radiogroup" className="grid grid-cols-3 gap-2">
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={selectedLevel === level}
                  onClick={() => onChange({ levels: { ...draft.levels, [sport]: level } })}
                  className={`rounded-full px-2 py-2.5 text-xs font-semibold transition ${
                    selectedLevel === level
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {tLevels(`${level}.title`)}
                </button>
              ))}
            </div>
            {selectedLevel && (
              <p className="text-xs text-muted">{tLevels(`${selectedLevel}.description`)}</p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

export function WorkStep({ draft, onChange }: StepProps) {
  const t = useTranslations("Onboarding.work");
  const tWork = useTranslations("WorkPatterns");

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <div role="radiogroup" className="flex flex-col gap-3">
        {workPatterns.map((pattern) => (
          <ChoiceCard
            key={pattern}
            kind="radio"
            title={tWork(`${pattern}.title`)}
            description={tWork(`${pattern}.description`)}
            selected={draft.workPattern === pattern}
            onSelect={() => onChange({ workPattern: pattern })}
          />
        ))}
      </div>
    </div>
  );
}

export function AvailabilityStep({ draft, onChange }: StepProps) {
  const t = useTranslations("Onboarding.availability");
  const tWeekdays = useTranslations("Weekdays");
  const formatDuration = useFormatDuration();
  const totalMinutes = draft.availability.reduce((sum, day) => sum + day.minutes, 0);

  function setDay(dayIndex: number, day: DayAvailability) {
    onChange({
      availability: draft.availability.map((current, index) => (index === dayIndex ? day : current)),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-col gap-3">
        {weekdays.map((weekday, index) => (
          <DayAvailabilityCard
            key={weekday}
            dayName={tWeekdays(weekday)}
            value={draft.availability[index]}
            onChange={(day) => setDay(index, day)}
            sportOptions={draft.sports}
          />
        ))}
      </div>
      <LongSessionPicker
        week={draft.availability}
        onChange={(availability) => onChange({ availability })}
        userSports={draft.sports}
      />
      <p className="text-center text-sm text-muted">
        {t("total", { total: formatDuration(totalMinutes) })}
      </p>
    </div>
  );
}
