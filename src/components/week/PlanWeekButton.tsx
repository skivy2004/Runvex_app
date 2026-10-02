"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { planWeekAction, type PlanWeekResult } from "@/app/(app)/week/actions";
import { Button } from "@/components/ui/Button";

type PlanWeekButtonProps = {
  /** Monday of the week to plan. */
  weekStart: string;
};

/** "Plan my week": lets the coach fill the open training days of this week. */
export function PlanWeekButton({ weekStart }: PlanWeekButtonProps) {
  const t = useTranslations("PlanWeek");
  const [result, setResult] = useState<PlanWeekResult | null>(null);
  const [isPlanning, startPlanning] = useTransition();

  function handleClick() {
    setResult(null);
    startPlanning(async () => {
      // On success the action refreshes the page, so the new trainings appear.
      setResult(await planWeekAction(weekStart));
    });
  }

  const message =
    result === null
      ? null
      : !result.ok
        ? t("failed")
        : result.planned === 0
          ? t("nothingToPlan")
          : result.source === "ai"
            ? t("plannedByCoach", { count: result.planned })
            : t("plannedByRules", { count: result.planned });

  return (
    <div className="flex flex-col gap-2">
      <Button fullWidth disabled={isPlanning} onClick={handleClick}>
        {isPlanning ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <Sparkles aria-hidden className="size-4" />
        )}
        {isPlanning ? t("planning") : t("button")}
      </Button>
      {/* role="status" makes screen readers read the result out loud. */}
      <p role="status" className={`text-center text-sm ${result?.ok === false ? "text-danger" : "text-muted"}`}>
        {isPlanning ? t("planningHint") : message}
      </p>
    </div>
  );
}
