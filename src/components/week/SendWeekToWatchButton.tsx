"use client";

import { LoaderCircle, Watch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { sendWeekToWatchAction } from "@/app/(app)/week/actions";

/** Sends the trainings of this week to the watch (via intervals.icu). */
export function SendWeekToWatchButton({ weekStart }: { weekStart: string }) {
  const t = useTranslations("Watch");
  const [result, setResult] = useState<"sent" | "failed" | null>(null);
  const [isSending, startSending] = useTransition();

  function handleClick() {
    setResult(null);
    startSending(async () => {
      const { ok } = await sendWeekToWatchAction(weekStart);
      setResult(ok ? "sent" : "failed");
    });
  }

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <button
        type="button"
        onClick={handleClick}
        disabled={isSending}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold text-accent hover:underline disabled:opacity-60"
      >
        {isSending ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <Watch aria-hidden className="size-4" />
        )}
        {t("sendWeek")}
      </button>
      <span role="status" className={result === "failed" ? "text-danger" : "text-muted"}>
        {result && t(result)}
      </span>
    </div>
  );
}
