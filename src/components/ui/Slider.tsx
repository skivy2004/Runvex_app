import { useId } from "react";

type SliderProps = {
  label: string;
  /** Human-readable value shown next to the label, e.g. "1 h 30 min". */
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Dims the value label, e.g. for "Not available". */
  muted?: boolean;
  /** Hides the label row visually (screen readers still read the label). */
  hideHeader?: boolean;
};

export function Slider({
  label,
  valueLabel,
  value,
  min,
  max,
  step,
  onChange,
  muted,
  hideHeader,
}: SliderProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <div className={hideHeader ? "sr-only" : "flex items-baseline justify-between"}>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className={`text-sm font-semibold ${muted ? "text-muted" : "text-accent"}`}>
          {valueLabel}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        // Screen readers read this instead of the raw number of minutes.
        aria-valuetext={valueLabel}
        onChange={(event) => onChange(Number(event.target.value))}
        // Tall enough for the round handle, which is bigger than the track.
        className="h-5 w-full cursor-pointer accent-accent"
      />
    </div>
  );
}
