"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId } from "react";
import { joinWaitlistAction, type WaitlistState } from "./actions";

const initialState: WaitlistState = { status: "idle" };

/**
 * Email field with the button inside it. "light" sits on the dark sections,
 * "dark" on the coral one. After joining, the form turns into a confirmation.
 */
export function WaitlistForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const t = useTranslations("Landing.waitlist");
  const [state, formAction, pending] = useActionState(joinWaitlistAction, initialState);
  const errorId = useId();
  const dark = tone === "dark";

  if (state.status === "joined") {
    return (
      <p
        role="status"
        className={`lp-pop flex min-h-12 items-center gap-2.5 font-body text-lg font-medium tracking-[-0.02em] ${dark ? "text-lp-bg" : "text-lp-pink"}`}
      >
        {/* The check draws itself once the text is in (.check-draw in globals.css). */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-5 shrink-0 ${dark ? "text-lp-bg" : "text-lp-coral"}`}
        >
          <path className="check-draw" style={{ animationDelay: "150ms" }} d="M4 12.5l5 5L20 6.5" />
        </svg>
        {/* One span, so the brand name stays inline instead of becoming its own flex item.
            On the coral band the name keeps the dark text color: coral on coral is invisible. */}
        <span>
          {t.rich("joined", {
            brand: (chunks) => <span className={`font-display ${dark ? "" : "text-lp-coral"}`}>{chunks}</span>,
          })}
        </span>
      </p>
    );
  }

  const error = state.status === "error" ? state.error : null;

  return (
    <form action={formAction} noValidate className="flex w-full max-w-[27rem] flex-col gap-2">
      <div
        className={`flex h-12 rounded-[15px] border p-0.5 transition-colors focus-within:border-2 focus-within:p-px ${
          dark ? "border-lp-bg bg-lp-bg/[0.12]" : "border-lp-pink bg-white/[0.04]"
        }`}
      >
        <label className="sr-only" htmlFor={`${errorId}-email`}>
          {t("emailLabel")}
        </label>
        <input
          id={`${errorId}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state.status === "error" ? state.email : ""}
          placeholder={t("placeholder")}
          aria-invalid={error === "invalidEmail" || undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-w-0 flex-1 bg-transparent px-3.5 text-base font-light outline-none sm:text-lg ${
            dark ? "text-lp-bg placeholder:text-lp-bg/60" : "text-lp-chalk placeholder:text-lp-pink/60"
          }`}
        />
        {/* Hidden from people, filled in by bots: the server then ignores the signup. */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px" />
        <button
          type="submit"
          disabled={pending}
          className={`shrink-0 rounded-[13px] px-4 text-base font-medium transition hover:brightness-110 active:scale-[0.97] disabled:opacity-70 sm:px-5 sm:text-lg ${
            dark ? "bg-lp-bg text-lp-chalk" : "bg-lp-coral text-lp-bg"
          }`}
        >
          {/* Both labels share one grid cell, so the button keeps the width of
              the longest and the field doesn't jump while sending. */}
          <span className="grid">
            <span className={`col-start-1 row-start-1 ${pending ? "invisible" : ""}`}>{t("submit")}</span>
            <span className={`col-start-1 row-start-1 ${pending ? "" : "invisible"}`}>{t("pending")}</span>
          </span>
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className={`lp-error-in text-sm font-medium ${dark ? "text-lp-bg" : "text-lp-pink"}`}>
          {t(`errors.${error}`)}
        </p>
      )}
    </form>
  );
}
