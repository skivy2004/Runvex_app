"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { countdownParts, startOfDayInTimeZone } from "@/core/home";

type RaceCountdownProps = {
  /** The race day, e.g. "2027-08-24". */
  date: string;
  timeZone: string;
};

/** Days, hours and minutes until race day starts in your time zone, updated every minute. */
export function RaceCountdown({ date, timeZone }: RaceCountdownProps) {
  const t = useTranslations("Home");
  const target = startOfDayInTimeZone(date, timeZone);
  // The server doesn't know the exact moment the page shows, so the time comes after loading.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const parts = now === null ? null : countdownParts(target, now);
  const units = [
    { value: parts?.days, label: t("countdownDays") },
    { value: parts?.hours, label: t("countdownHours") },
    { value: parts?.minutes, label: t("countdownMinutes") },
  ];

  return (
    <p className="flex items-baseline gap-3" aria-live="off">
      {units.map(({ value, label }, index) => (
        <span key={label} className="flex items-baseline gap-1">
          {index > 0 && <span aria-hidden className="mr-2 size-1.5 self-center rounded-full bg-accent" />}
          <span className="text-5xl font-bold tracking-tighter tabular-nums">{value ?? "–"}</span>
          <span className="text-[0.6rem] font-bold uppercase tracking-wider text-muted">{label}</span>
        </span>
      ))}
    </p>
  );
}
