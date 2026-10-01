"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Slider } from "@/components/ui/Slider";
import { useFormatDuration } from "@/components/useFormatDuration";
import {
  emptyDay,
  MAX_SLIDER_POSITION,
  minutesToSliderPosition,
  normalizeDay,
  sliderPositionToMinutes,
  type DayAvailability,
} from "@/core/availability";
import type { Sport } from "@/core/training";
import { toggle } from "./draft";

// Time a day gets when it's switched on.
const DEFAULT_DAY_MINUTES = 60;

type DayAvailabilityCardProps = {
  dayName: string;
  /** 0 minutes = rest day, which also means the card is closed. */
  value: DayAvailability;
  onChange: (value: DayAvailability) => void;
  /** The sports the user does; they can pick from these per day. */
  sportOptions: Sport[];
};

export function DayAvailabilityCard({ dayName, value, onChange, sportOptions }: DayAvailabilityCardProps) {
  const t = useTranslations("Onboarding.availability");
  const tSports = useTranslations("Sports");
  const formatDuration = useFormatDuration();
  const toggleRef = useRef<HTMLButtonElement>(null);
  // While the user drags the slider, the card stays open even at "rest day".
  // It only closes when they let go, so the slider doesn't vanish mid-drag.
  const [isDragging, setIsDragging] = useState(false);

  const isOn = value.minutes > 0;
  const isOpen = isOn || isDragging;
  const valueLabel = isOn ? formatDuration(value.minutes) : t("restDay");

  function switchOn() {
    // With only one sport there's nothing to choose, so select it right away.
    onChange({
      minutes: DEFAULT_DAY_MINUTES,
      sports: sportOptions.length === 1 ? [...sportOptions] : [],
      longSessions: [],
    });
  }

  function switchOff() {
    onChange(emptyDay());
  }

  function toggleSport(sport: Sport) {
    // normalizeDay drops a long session whose sport no longer fits this day.
    onChange(normalizeDay({ ...value, sports: toggle(value.sports, sport) }));
  }

  function handleSliderChange(position: number) {
    const minutes = sliderPositionToMinutes(position);
    if (minutes === 0) {
      switchOff();
      // With the keyboard there's no "letting go": the card closes right away,
      // so move focus to the day button instead of losing it.
      if (!isDragging) toggleRef.current?.focus();
    } else {
      // Coming back from "rest day" while dragging: keep any chosen sports.
      onChange({ ...value, minutes });
    }
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
        onClick={isOn ? switchOff : switchOn}
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
        `inert` keeps the hidden controls out of keyboard navigation.
      */}
      <div
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 px-4 pt-1 pb-4">
            {/* pt-1 above leaves room for the slider handle, which is taller than the track. */}
            <div
              onPointerDown={() => setIsDragging(true)}
              onPointerUp={() => setIsDragging(false)}
              onPointerCancel={() => setIsDragging(false)}
            >
              <Slider
                hideHeader
                label={dayName}
                valueLabel={valueLabel}
                value={minutesToSliderPosition(value.minutes)}
                min={0}
                max={MAX_SLIDER_POSITION}
                step={1}
                onChange={handleSliderChange}
              />
            </div>

            {sportOptions.length > 1 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-xs text-muted">{t("sportsLabel")}</legend>
                <div className="flex flex-wrap gap-2">
                  {sportOptions.map((sport) => {
                    const isSelected = value.sports.includes(sport);
                    return (
                      <button
                        key={sport}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleSport(sport)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-accent text-accent-foreground"
                            : "bg-surface-raised text-muted hover:text-foreground"
                        }`}
                      >
                        {tSports(sport)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
