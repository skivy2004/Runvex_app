"use client";

import { BatteryCharging, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { setRecoveryWeekAction } from "@/app/(app)/week/actions";

type RecoveryWeekToggleProps = {
  weekStart: string;
  /** True when you already turned this week into a recovery week. */
  isOverride: boolean;
};

/** "Make this a recovery week", e.g. for a week of night shifts, or undo it. */
export function RecoveryWeekToggle({ weekStart, isOverride }: RecoveryWeekToggleProps) {
  const t = useTranslations("Season");
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setFailed(false);
    startTransition(async () => {
      // On success the page refreshes with the new block.
      const result = await setRecoveryWeekAction(weekStart, !isOverride);
      if (!result.ok) setFailed(true);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={`flex w-fit items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm font-bold transition active:scale-95 ${
          isPending ? "opacity-60" : "hover:bg-white/[0.06]"
        } ${isOverride ? "text-muted" : "text-blue-light"}`}
      >
        {isOverride ? <Undo2 aria-hidden className="size-4" /> : <BatteryCharging aria-hidden className="size-4" />}
        {t(isOverride ? "undoRecovery" : "makeRecovery")}
      </button>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t("failed")}
        </p>
      )}
    </div>
  );
}
