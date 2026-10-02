"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition } from "react";
import { addWorkoutAction } from "@/app/(app)/week/actions";
import { SportIcon } from "@/components/SportIcon";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useFormatDuration } from "@/components/useFormatDuration";
import type { Sport } from "@/core/training";
import { MAX_TITLE_LENGTH, MAX_WORKOUT_MINUTES, MIN_WORKOUT_MINUTES } from "@/core/validation/workouts";

export type LibraryOption = { id: string; sport: Sport; name: string; minutes: number; isHard: boolean };

type AddWorkoutFormProps = {
  initialDate: string;
  /** The user's own sports. */
  sports: Sport[];
  /** Library workouts per sport, already suited to the user's level. */
  library: LibraryOption[];
};

type Mode = "library" | "own";

/** Add a training: pick a library workout, or describe your own (e.g. strength). */
export function AddWorkoutForm({ initialDate, sports, library }: AddWorkoutFormProps) {
  const t = useTranslations("AddWorkout");
  const tSports = useTranslations("Sports");
  const formatDuration = useFormatDuration();
  const selectId = useId();

  const [date, setDate] = useState(initialDate);
  const [sport, setSport] = useState<Sport>(sports[0] ?? "running");
  const options = library.filter((option) => option.sport === sport);
  // Strength (and any sport without library workouts) can only be your own training.
  const [mode, setMode] = useState<Mode>(options.length > 0 ? "library" : "own");
  const effectiveMode: Mode = options.length > 0 ? mode : "own";
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("");
  const [failed, setFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const isComplete =
    date !== "" &&
    (effectiveMode === "library" ? templateId !== "" : title.trim() !== "" && minutes !== "");

  function chooseSport(next: Sport) {
    setSport(next);
    setTemplateId("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFailed(false);
    startSaving(async () => {
      // On success the action opens the week of this training.
      const result = await addWorkoutAction({
        date,
        sport,
        templateId: effectiveMode === "library" ? templateId : null,
        title: effectiveMode === "own" ? title : "",
        durationMinutes: effectiveMode === "own" ? Number(minutes) : null,
      });
      if (!result.ok) setFailed(true);
    });
  }

  const pill = (selected: boolean) =>
    `flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition ${
      selected ? "border-accent bg-accent/10 text-foreground" : "border-line bg-surface text-muted hover:text-foreground"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <TextField label={t("date")} type="date" required value={date} onChange={(e) => setDate(e.target.value)} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">{t("sport")}</legend>
        <div className="flex flex-wrap gap-2">
          {sports.map((item) => (
            <button key={item} type="button" aria-pressed={sport === item} onClick={() => chooseSport(item)} className={pill(sport === item)}>
              <SportIcon sport={item} small />
              {tSports(item)}
            </button>
          ))}
        </div>
      </fieldset>

      {options.length > 0 && (
        <div className="flex gap-2" role="group" aria-label={t("kind")}>
          <button type="button" aria-pressed={effectiveMode === "library"} onClick={() => setMode("library")} className={`flex-1 justify-center ${pill(effectiveMode === "library")}`}>
            {t("fromLibrary")}
          </button>
          <button type="button" aria-pressed={effectiveMode === "own"} onClick={() => setMode("own")} className={`flex-1 justify-center ${pill(effectiveMode === "own")}`}>
            {t("own")}
          </button>
        </div>
      )}

      {effectiveMode === "library" ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={selectId} className="text-sm font-medium">
            {t("workout")}
          </label>
          <select
            id={selectId}
            required
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="h-12 rounded-2xl border border-line bg-surface px-4 text-foreground outline-none focus:border-accent"
          >
            <option value="">{t("chooseWorkout")}</option>
            {[false, true].map((hard) => (
              <optgroup key={String(hard)} label={hard ? t("hardGroup") : t("easyGroup")}>
                {options
                  .filter((option) => option.isHard === hard)
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} · {formatDuration(option.minutes)}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      ) : (
        <>
          <TextField
            label={t("title")}
            placeholder={sport === "strength" ? t("strengthPlaceholder") : t("titlePlaceholder")}
            required
            maxLength={MAX_TITLE_LENGTH}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            label={t("minutes")}
            type="number"
            inputMode="numeric"
            required
            min={MIN_WORKOUT_MINUTES}
            max={MAX_WORKOUT_MINUTES}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </>
      )}

      {failed && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t("failed")}
        </p>
      )}
      <Button type="submit" fullWidth disabled={!isComplete || isSaving}>
        {t("submit")}
      </Button>
    </form>
  );
}
