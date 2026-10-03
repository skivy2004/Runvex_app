"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { applyProposalAction, dismissProposalAction } from "@/app/(app)/coach/actions";

type ProposalCardProps = {
  messageId: string;
  /** One line per change, e.g. "Tue 6 Oct · Tempo → Easy run (easier)", with the coach's reason. */
  changes: { label: string; reason: string }[];
  status: "pending" | "applied" | "dismissed";
};

/** What a coach proposes to change. Nothing happens until you tap "Apply". */
export function ProposalCard({ messageId, changes, status }: ProposalCardProps) {
  const t = useTranslations("Coach");
  const [failed, setFailed] = useState(false);
  /** True right after you decided here, so the outcome animates in (not on page load). */
  const [justDecided, setJustDecided] = useState(false);
  const [isPending, startTransition] = useTransition();

  function decide(apply: boolean) {
    setFailed(false);
    startTransition(async () => {
      // On success the action refreshes the page with the new status (and plan).
      const result = await (apply ? applyProposalAction(messageId) : dismissProposalAction(messageId));
      if (result.ok) setJustDecided(true);
      else setFailed(true);
    });
  }

  return (
    <div className={`mt-3 flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent/[0.06] p-3 ${isPending ? "opacity-60" : ""}`}>
      <p className="eyebrow !text-accent">{t("proposal")}</p>
      <ul className="flex flex-col gap-2">
        {changes.map((change, index) => (
          <li key={index} className="flex flex-col text-sm">
            <span className="font-bold">{change.label}</span>
            <span className="text-muted">{change.reason}</span>
          </li>
        ))}
      </ul>
      {status === "pending" ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => decide(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-2.5 text-sm font-bold text-accent-foreground transition active:scale-[0.97]"
          >
            <Check aria-hidden className="size-4" />
            {t("apply")}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => decide(false)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-bold text-muted transition hover:text-foreground active:scale-[0.97]"
          >
            <X aria-hidden className="size-4" />
            {t("dismiss")}
          </button>
        </div>
      ) : (
        <p
          className={`flex items-center gap-1.5 text-sm font-bold ${status === "applied" ? "text-accent" : "text-muted"} ${justDecided ? "enter-pop" : ""}`}
        >
          {status === "applied" && (
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path className={justDecided ? "check-draw" : undefined} d="M4 12.5l5 5L20 6.5" />
            </svg>
          )}
          {t(status === "applied" ? "applied" : "dismissed")}
        </p>
      )}
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t("failed")}
        </p>
      )}
    </div>
  );
}
