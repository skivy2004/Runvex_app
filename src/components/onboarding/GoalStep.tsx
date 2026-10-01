"use client";

import { useTranslations } from "next-intl";
import { ChoiceCard } from "@/components/ui/ChoiceCard";
import { TextField } from "@/components/ui/TextField";
import { useDistanceInputValue, useFormatDistance } from "@/components/useFormatDistance";
import {
  categorySports,
  CUSTOM_PRESET,
  distanceUnit,
  goalCategories,
  parseDistanceInput,
  presetsFor,
  type GoalCategory,
  type RacePreset,
} from "@/core/racePresets";
import { sports, type Sport } from "@/core/training";
import { toggle, type OnboardingDraft } from "./draft";
import { StepHeading } from "./StepHeading";

type GoalStepProps = {
  draft: OnboardingDraft;
  onChange: (changes: Partial<OnboardingDraft>) => void;
};

/** Small pill button used for single or multiple choice. */
function Pill({
  selected,
  onClick,
  children,
  role,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: "radio";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role ? selected : undefined}
      aria-pressed={role ? undefined : selected}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        selected ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function GoalStep({ draft, onChange }: GoalStepProps) {
  const t = useTranslations("Onboarding.goal");
  const tSports = useTranslations("Sports");
  const tPresets = useTranslations("RacePresets");
  const formatDistance = useFormatDistance();
  const distanceInputValue = useDistanceInputValue();

  const category = draft.goalCategory;
  const hasDistances = category !== null && category !== "other";

  // Only overwrite the description while the user hasn't typed their own.
  function autoDescription(text: string): Partial<OnboardingDraft> {
    return draft.goalDescriptionEdited ? {} : { goalDescription: text };
  }

  function chooseCategory(next: GoalCategory) {
    onChange({
      goalCategory: next,
      goalPreset: null,
      goalDistances: {},
      // Suggest the sports chosen earlier as a starting point for "other".
      goalSports: next === "other" ? draft.sports : [],
      ...autoDescription(""),
    });
  }

  function choosePreset(preset: RacePreset) {
    onChange({
      goalPreset: preset.key,
      goalDistances: Object.fromEntries(
        preset.segments.map((segment) => [
          segment.sport,
          distanceInputValue(segment.sport, segment.distanceMeters),
        ]),
      ),
      ...autoDescription(tPresets(`${preset.key}.description`)),
    });
  }

  function setDistance(sport: Sport, text: string) {
    // Changing a distance makes it a custom goal.
    onChange({
      goalPreset: CUSTOM_PRESET,
      goalDistances: { ...draft.goalDistances, [sport]: text },
    });
  }

  function setDescription(text: string) {
    onChange({ goalDescription: text, goalDescriptionEdited: text.trim() !== "" });
  }

  return (
    <div className="flex flex-col gap-6">
      <StepHeading title={t("title")} />
      <div role="radiogroup" className="flex flex-col gap-3">
        <ChoiceCard
          kind="radio"
          title={t("hasGoal")}
          description={t("hasGoalDescription")}
          selected={draft.goalChoice === "goal"}
          onSelect={() => onChange({ goalChoice: "goal" })}
        />
        <ChoiceCard
          kind="radio"
          title={t("noGoal")}
          description={t("noGoalDescription")}
          selected={draft.goalChoice === "none"}
          onSelect={() => onChange({ goalChoice: "none" })}
        />
      </div>

      {draft.goalChoice === "goal" && (
        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("categoryLabel")}</legend>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {goalCategories.map((option) => (
                <Pill
                  key={option}
                  role="radio"
                  selected={category === option}
                  onClick={() => chooseCategory(option)}
                >
                  {t(`categories.${option}`)}
                </Pill>
              ))}
            </div>
          </fieldset>

          {hasDistances && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t("distanceLabel")}</legend>
              <div role="radiogroup" className="grid grid-cols-2 gap-3">
                {presetsFor(category).map((preset) => (
                  <ChoiceCard
                    key={preset.key}
                    kind="radio"
                    title={tPresets(`${preset.key}.label`)}
                    description={preset.segments
                      .map((segment) => formatDistance(segment.distanceMeters))
                      .join(" · ")}
                    selected={draft.goalPreset === preset.key}
                    onSelect={() => choosePreset(preset)}
                  />
                ))}
                <ChoiceCard
                  kind="radio"
                  title={t("custom")}
                  description={t("customDescription")}
                  selected={draft.goalPreset === CUSTOM_PRESET}
                  onSelect={() => onChange({ goalPreset: CUSTOM_PRESET })}
                />
              </div>
            </fieldset>
          )}

          {hasDistances && draft.goalPreset !== null && (
            <div className="grid grid-cols-1 gap-4">
              {categorySports[category].map((sport) => {
                const text = draft.goalDistances[sport] ?? "";
                const isInvalid = text.trim() !== "" && parseDistanceInput(sport, text) === null;
                return (
                  <div key={sport} className="flex flex-col gap-1.5">
                    <TextField
                      label={tSports(sport)}
                      hint={distanceUnit(sport) === "m" ? t("unitMeters") : t("unitKilometers")}
                      // Shows a number keyboard with a decimal key on phones.
                      inputMode="decimal"
                      aria-invalid={isInvalid}
                      value={text}
                      onChange={(event) => setDistance(sport, event.target.value)}
                    />
                    {isInvalid && (
                      <p role="alert" className="text-sm text-danger">
                        {t("invalidDistance")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {category === "other" && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t("sportsLabel")}</legend>
              <div className="flex flex-wrap gap-2">
                {sports.map((sport) => (
                  <Pill
                    key={sport}
                    selected={draft.goalSports.includes(sport)}
                    onClick={() => onChange({ goalSports: toggle(draft.goalSports, sport) })}
                  >
                    {tSports(sport)}
                  </Pill>
                ))}
              </div>
            </fieldset>
          )}

          {category !== null && (
            <>
              <TextField
                label={t("description")}
                placeholder={t("descriptionPlaceholder")}
                maxLength={500}
                value={draft.goalDescription}
                onChange={(event) => setDescription(event.target.value)}
              />
              <TextField
                label={t("eventName")}
                hint={t("optional")}
                placeholder={t("eventNamePlaceholder")}
                maxLength={120}
                value={draft.eventName}
                onChange={(event) => onChange({ eventName: event.target.value })}
              />
              <TextField
                label={t("eventDate")}
                hint={t("optional")}
                type="date"
                value={draft.eventDate}
                onChange={(event) => onChange({ eventDate: event.target.value })}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
