"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { submitTrainingFeedbackAction, type CoachActionResult } from "@/app/(app)/coach/actions";
import type { Feeling } from "@/core/coach/conversation";

const feelingOptions: Feeling[] = ["easy", "right", "hard"];
const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** "How did it go?": how it felt, effort 1-10 and a few words. The coach reacts. */
export function TrainingFeedbackForm({ workoutId }: { workoutId: string }) {
  const t = useTranslations("Coach");
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<CoachActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function send() {
    if (!feeling) return;
    setResult(null);
    startTransition(async () => {
      // On success the page refreshes and shows the coach's reaction.
      setResult(await submitTrainingFeedbackAction({ workoutId, feeling, rpe, note }));
    });
  }

  const chip = (selected: boolean) =>
    `flex-1 rounded-xl border px-2 py-2.5 text-sm font-bold transition active:scale-[0.97] ${
      selected ? "border-accent bg-accent/15 text-accent" : "border-white/10 bg-white/[0.04] text-muted hover:text-foreground"
    }`;

  return (
    <div className={`flex flex-col gap-4 ${isPending ? "pointer-events-none" : ""}`}>
      <div role="radiogroup" aria-label={t("feelingLabel")} className="flex gap-2">
        {feelingOptions.map((option) => (
          <button key={option} type="button" role="radio" aria-checked={feeling === option} onClick={() => setFeeling(option)} className={chip(feeling === option)}>
            {t(`feeling.${option}`)}
          </button>
        ))}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-muted">{t("effort")}</legend>
        <div className="grid grid-cols-10 gap-1">
          {RPE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={rpe === value}
              onClick={() => setRpe(rpe === value ? null : value)}
              className={`aspect-square rounded-lg text-xs font-bold transition ${
                rpe === value ? "bg-accent text-accent-foreground" : "bg-white/[0.05] text-muted hover:text-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex items-end gap-2">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder={t("notePlaceholder")}
          aria-label={t("noteLabel")}
          className="min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none transition focus:border-accent"
        />
        <button
          type="button"
          onClick={send}
          disabled={!feeling || isPending}
          aria-label={t("send")}
          className="auth-cta flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition active:scale-[0.97] disabled:animate-none disabled:opacity-40"
        >
          <Send aria-hidden className="size-5" />
        </button>
      </div>

      {isPending && <p className="typing-dots text-sm text-muted">{t("coachReading")}</p>}
      {result && !result.ok && (
        <p role="alert" className="rounded-2xl bg-white/[0.05] px-4 py-3 text-sm text-muted">
          {t(`errors.${result.error}`)}
        </p>
      )}
    </div>
  );
}
