"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveWorkoutFeedbackAction } from "@/app/(app)/week/actions";
import { Button } from "@/components/ui/Button";
import { MAX_FEEDBACK_NOTE_LENGTH, type WorkoutStatus } from "@/core/validation/feedback";

type WorkoutFeedbackProps = {
  workoutId: string;
  status: WorkoutStatus;
  rpe: number | null;
  note: string | null;
};

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Done or skipped, and for a done training how hard it felt (RPE 1-10) with a note. */
export function WorkoutFeedback({ workoutId, status, rpe, note }: WorkoutFeedbackProps) {
  const t = useTranslations("Feedback");
  /** Filling in how it went, after tapping "Done". */
  const [isRating, setIsRating] = useState(false);
  const [chosenRpe, setChosenRpe] = useState<number | null>(rpe);
  const [text, setText] = useState(note ?? "");
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save(next: WorkoutStatus, withRpe: number | null = null, withNote: string | null = null) {
    setFailed(false);
    startTransition(async () => {
      // On success the action refreshes the page with the new status.
      const result = await saveWorkoutFeedbackAction({ id: workoutId, status: next, rpe: withRpe, note: withNote });
      if (result.ok) setIsRating(false);
      else setFailed(true);
    });
  }

  const error = failed && (
    <p role="alert" className="text-sm text-danger">
      {t("failed")}
    </p>
  );

  if (status !== "planned" && !isRating) {
    return (
      <section className={`flex flex-col gap-2 rounded-xl bg-surface-raised p-3 ${isPending ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm font-semibold">
            {status === "done" ? (rpe ? t("doneWithRpe", { rpe }) : t("done")) : t("skipped")}
          </span>
          {status === "done" && (
            <button type="button" onClick={() => setIsRating(true)} className="text-sm font-semibold text-accent">
              {t("edit")}
            </button>
          )}
          <button
            type="button"
            onClick={() => save("planned")}
            disabled={isPending}
            className="flex items-center gap-1 text-sm font-semibold text-muted hover:text-foreground"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            {t("undo")}
          </button>
        </div>
        {status === "done" && note && <p className="text-sm text-muted">{note}</p>}
        {error}
      </section>
    );
  }

  if (isRating) {
    return (
      <section className={`flex flex-col gap-3 rounded-xl bg-surface-raised p-3 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t("rpeQuestion")}</legend>
          <div className="grid grid-cols-10 gap-1">
            {RPE_VALUES.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={chosenRpe === value}
                onClick={() => setChosenRpe(chosenRpe === value ? null : value)}
                className={`aspect-square rounded-full text-sm font-semibold transition ${
                  chosenRpe === value ? "bg-accent text-accent-foreground" : "bg-surface text-foreground hover:bg-line"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="flex justify-between text-xs text-muted">
            <span>{t("rpeEasy")}</span>
            <span>{t("rpeMax")}</span>
          </p>
        </fieldset>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t("noteLabel")}
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MAX_FEEDBACK_NOTE_LENGTH}
            rows={2}
            placeholder={t("notePlaceholder")}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-sm font-normal outline-none focus:border-accent"
          />
        </label>
        {error}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsRating(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" fullWidth onClick={() => save("done", chosenRpe, text)}>
            {t("save")}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={`flex flex-col gap-2 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
      <div className="flex gap-2">
        <Button type="button" fullWidth onClick={() => setIsRating(true)}>
          <Check aria-hidden className="size-4" />
          {t("markDone")}
        </Button>
        <Button type="button" variant="secondary" fullWidth onClick={() => save("skipped")}>
          <X aria-hidden className="size-4" />
          {t("markSkipped")}
        </Button>
      </div>
      {error}
    </section>
  );
}
