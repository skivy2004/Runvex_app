"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { useFormatDuration } from "@/components/useFormatDuration";
import { MAX_DAILY_MINUTES, MINUTES_STEP } from "@/core/validation/onboarding";

// Time a day gets when it's switched on.
const DEFAULT_DAY_MINUTES = 60;

type DayAvailabilityCardProps = {
  dayName: string;
  /** 0 = not available, which also means the card is closed. */
  minutes: number;
  onChange: (minutes: number) => void;
};

export function DayAvailabilityCard({ dayName, minutes, onChange }: DayAvailabilityCardProps) {
  const t = useTranslations("Onboarding.availability");
  const formatDuration = useFormatDuration();
  const toggleRef = useRef<HTMLButtonElement>(null);
  // While the user drags the slider, the card stays open even at 0 minutes.
  // It only closes when they let go, so the slider doesn't vanish mid-drag.
  const [isDragging, setIsDragging] = useState(false);

  const isOn = minutes > 0;
  const isOpen = isOn || isDragging;
  const valueLabel = isOn ? formatDuration(minutes) : t("restDay");

  function handleSliderChange(value: number) {
    onChange(value);
    // With the keyboard there's no "letting go": the card closes right away,
    // so move focus to the day button instead of losing it.
    if (value === 0 && !isDragging) toggleRef.current?.focus();
  }

  return (
    <div
      className={`rounded-2xl border transition-colors duration-300 ${
        isOn ? "border-accent bg-accent/10" : "border-line bg-surface"
      }`}
    >
      <button
        ref={toggleRef}
        type="button"
        aria-pressed={isOn}
        onClick={() => onChange(isOn ? 0 : DEFAULT_DAY_MINUTES)}
        className="flex w-full items-center justify-between rounded-2xl p-4 text-left focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="font-semibold">{dayName}</span>
        {isOn ? (
          <span className="text-sm font-semibold text-accent">{valueLabel}</span>
        ) : (
          <span className="flex items-center gap-2 text-sm text-muted">
            {valueLabel}
            {/* The "+" shows that tapping adds training time to this day. */}
            <span
              aria-hidden
              className="flex size-6 items-center justify-center rounded-full border border-accent text-base leading-none text-accent"
            >
              +
            </span>
          </span>
        )}
      </button>

      {/*
        Expand animation: animating grid rows from 0fr to 1fr lets the height
        grow smoothly to whatever the content needs.
        `inert` keeps the hidden slider out of keyboard navigation.
      */}
      <div
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {/* pt-1 leaves room for the slider handle, which is taller than the track. */}
          <div
            className="px-4 pt-1 pb-4"
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => setIsDragging(false)}
            onPointerCancel={() => setIsDragging(false)}
          >
            <Slider
              hideHeader
              label={dayName}
              valueLabel={valueLabel}
              value={minutes}
              min={0}
              max={MAX_DAILY_MINUTES}
              step={MINUTES_STEP}
              onChange={handleSliderChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
