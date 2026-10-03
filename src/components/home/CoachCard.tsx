"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type CoachCardProps = {
  /** Why the coach planned this training (the note it wrote when planning). */
  note: string;
  /** The training it's about. */
  workoutName: string;
};

/** The coach's message about your next training, typed out letter by letter. Give it key={note} to restart. */
export function CoachCard({ note, workoutName }: CoachCardProps) {
  const t = useTranslations("Home");
  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Less motion: the whole message in one step.
    const step = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? note.length : 2;
    const timer = setInterval(() => {
      setShown((count) => {
        const next = Math.min(note.length, count + step);
        if (next >= note.length) clearInterval(timer);
        return next;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [note]);

  const isTyping = shown < note.length;

  return (
    <section className="flex flex-col gap-4 rounded-[2rem] border border-accent/20 bg-gradient-to-br from-blue/20 via-surface/70 to-coral/10 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-blue">
          <Sparkles className="size-6" />
        </span>
        <div className="flex flex-col">
          <p className="eyebrow">{t("coachEyebrow")}</p>
          <h2 className="text-xl font-bold">{t("coachTitle")}</h2>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
        {/* Screen readers get the whole message at once, not letter by letter. */}
        <p className="sr-only">{note}</p>
        <p aria-hidden className={`leading-relaxed ${isTyping ? "typing-cursor" : ""}`}>
          {note.slice(0, shown)}
        </p>
        <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">
          {t("coachAbout", { name: workoutName })}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/week"
          prefetch
          className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-bold text-accent transition active:scale-95"
        >
          {t("seePlan")}
          <ChevronRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
