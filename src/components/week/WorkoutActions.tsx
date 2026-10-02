"use client";

import { ArrowLeftRight, CalendarArrowUp, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  deleteWorkoutAction,
  moveWorkoutAction,
  swapWorkoutAction,
  type WorkoutActionResult,
} from "@/app/(app)/week/actions";
import { Button } from "@/components/ui/Button";
import { useFormatDuration } from "@/components/useFormatDuration";
import { toFormattableDate } from "@/core/dates";
import { WorkoutDetails, type WorkoutDetailsData } from "./WorkoutDetails";
import { useWorkoutDialog } from "./WorkoutDialog";

/** A library workout that can replace the current one, with everything to preview it. */
export type Alternative = WorkoutDetailsData & {
  id: string;
  name: string;
  minutes: number;
  isHard: boolean;
};

type WorkoutActionsProps = {
  workoutId: string;
  date: string;
  /** The 7 dates of this week, for "Move to". */
  weekDates: string[];
  /** Library workouts that can replace this one; empty for your own trainings. */
  alternatives: Alternative[];
};

type Panel = "swap" | "move" | "delete" | null;

/** Swap, move and delete, at the bottom of the workout window. */
export function WorkoutActions({ workoutId, date, weekDates, alternatives }: WorkoutActionsProps) {
  const t = useTranslations("WorkoutActions");
  const format = useFormatter();
  const locale = useLocale();
  const formatDuration = useFormatDuration();
  const dialog = useWorkoutDialog();
  const [panel, setPanel] = useState<Panel>(null);
  /** The alternative being previewed in the swap panel. */
  const [preview, setPreview] = useState<Alternative | null>(null);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Runs a change. Moving and deleting close the window first, so it can shrink back
   * nicely before the card moves or disappears; if saving fails, it opens again.
   */
  function run(action: () => Promise<WorkoutActionResult>, closeFirst: boolean) {
    setFailed(false);
    if (closeFirst) dialog.close();
    startTransition(async () => {
      // On success the action refreshes the page with the new week.
      const result = await action();
      if (result.ok) {
        setPanel(null);
        setPreview(null);
      } else {
        setFailed(true);
        if (closeFirst) dialog.open();
      }
    });
  }

  function toggle(next: Panel) {
    setPreview(null);
    setPanel((current) => (current === next ? null : next));
  }

  const tabClass = (name: Panel) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${
      panel === name ? "bg-accent text-accent-foreground" : "bg-surface-raised text-foreground hover:bg-line"
    }`;

  const hardBadge = (
    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-xs font-semibold text-danger">{t("hard")}</span>
  );

  return (
    <div className={`flex flex-col gap-3 border-t border-line pt-4 ${isPending ? "pointer-events-none opacity-60" : ""}`}>
      <div className="flex gap-2">
        {alternatives.length > 0 && (
          <button type="button" className={tabClass("swap")} aria-expanded={panel === "swap"} onClick={() => toggle("swap")}>
            <ArrowLeftRight aria-hidden className="size-4" />
            {t("swap")}
          </button>
        )}
        <button type="button" className={tabClass("move")} aria-expanded={panel === "move"} onClick={() => toggle("move")}>
          <CalendarArrowUp aria-hidden className="size-4" />
          {t("move")}
        </button>
        <button type="button" className={tabClass("delete")} aria-expanded={panel === "delete"} onClick={() => toggle("delete")}>
          <Trash2 aria-hidden className="size-4" />
          <span className="sr-only">{t("delete")}</span>
        </button>
      </div>

      {panel === "swap" && !preview && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{t("swapTitle")}</p>
          <ul className="flex flex-col gap-1.5">
            {alternatives.map((alternative) => (
              <li key={alternative.id}>
                <button
                  type="button"
                  onClick={() => setPreview(alternative)}
                  className="flex w-full items-center gap-2 rounded-xl bg-surface-raised px-3 py-2.5 text-left text-sm transition hover:bg-line"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{alternative.name}</span>
                    <span className="block truncate text-muted">{alternative.description}</span>
                  </span>
                  {alternative.isHard && hardBadge}
                  <span className="shrink-0 text-muted">{formatDuration(alternative.minutes)}</span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {panel === "swap" && preview && (
        // The whole alternative, just like the training itself, before you choose it.
        <div className="flex flex-col gap-4 rounded-2xl bg-surface-raised p-3">
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <ChevronLeft aria-hidden className="size-4" />
            {t("backToAlternatives")}
          </button>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{preview.name}</h3>
            <span className="flex shrink-0 items-center gap-2 text-sm text-muted">
              {preview.isHard && hardBadge}
              {formatDuration(preview.minutes)}
            </span>
          </div>
          <WorkoutDetails
            description={preview.description}
            sport={preview.sport}
            steps={preview.steps}
            zones={preview.zones}
            locale={locale}
          />
          <Button fullWidth onClick={() => run(() => swapWorkoutAction(workoutId, preview.id), false)}>
            <ArrowLeftRight aria-hidden className="size-4" />
            {t("swapToThis")}
          </Button>
        </div>
      )}

      {panel === "move" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">{t("moveTitle")}</p>
          <div className="grid grid-cols-7 gap-1">
            {weekDates.map((day) => {
              const formattable = toFormattableDate(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={day === date}
                  aria-label={format.dateTime(formattable, { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
                  onClick={() => run(() => moveWorkoutAction(workoutId, day), true)}
                  className="flex flex-col items-center rounded-xl bg-surface-raised py-2 text-xs transition hover:bg-line disabled:bg-accent disabled:text-accent-foreground"
                >
                  <span className="font-semibold first-letter:uppercase">
                    {format.dateTime(formattable, { weekday: "short", timeZone: "UTC" })}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {format.dateTime(formattable, { day: "numeric", timeZone: "UTC" })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {panel === "delete" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{t("deleteQuestion")}</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setPanel(null)}>
              {t("cancel")}
            </Button>
            <Button className="flex-1 !bg-danger !text-background" onClick={() => run(() => deleteWorkoutAction(workoutId), true)}>
              {t("confirmDelete")}
            </Button>
          </div>
        </div>
      )}

      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t("failed")}
        </p>
      )}
    </div>
  );
}
