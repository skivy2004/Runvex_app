"use client";

import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { sendCoachMessageAction, type CoachActionResult } from "@/app/(app)/coach/actions";
import { CoachBubble } from "./CoachBubble";

/** The message box under the chat. While the coaches think, your message already shows. */
export function CoachComposer({ suggestions }: { suggestions: string[] }) {
  const t = useTranslations("Coach");
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [result, setResult] = useState<CoachActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isPending, result]);

  function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isPending) return;
    setResult(null);
    setSent(trimmed);
    setText("");
    startTransition(async () => {
      // On success the page refreshes with the saved messages and the reply.
      const outcome = await sendCoachMessageAction(trimmed);
      setResult(outcome);
      if (outcome.ok) setSent(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {sent && isPending && (
        <>
          <CoachBubble agent={null}>{sent}</CoachBubble>
          <CoachBubble agent="head">
            <span className="typing-dots text-muted">{t("thinking")}</span>
          </CoachBubble>
        </>
      )}
      {result && !result.ok && (
        <p role="alert" className="rounded-2xl bg-white/[0.05] px-4 py-3 text-sm text-muted">
          {t(`errors.${result.error}`)}
        </p>
      )}
      <div ref={endRef} />

      {/* The box sits just above the tab bar. */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(text);
        }}
        className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] flex flex-col gap-2"
      >
        {suggestions.length > 0 && !isPending && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => send(suggestion)}
                className="shrink-0 rounded-full border border-accent/30 bg-background/80 px-3.5 py-2 text-xs font-bold text-accent backdrop-blur-xl transition active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-[1.5rem] border border-white/10 bg-surface/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter is a new line.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(text);
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none field-sizing-content"
          />
          <button
            type="submit"
            disabled={!text.trim() || isPending}
            aria-label={t("send")}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition active:scale-95 disabled:opacity-40"
          >
            <ArrowUp aria-hidden className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
