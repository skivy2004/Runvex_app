type ProgressBarProps = {
  value: number;
  max: number;
  /** Read aloud by screen readers, e.g. "Training hours this week". */
  label: string;
};

export function ProgressBar({ value, max, label }: ProgressBarProps) {
  // Guard against dividing by zero and against overshooting 100%.
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2.5 w-full overflow-hidden rounded-full bg-surface-raised"
    >
      <div
        className="h-full rounded-full bg-accent transition-transform duration-500 ease-out"
        // Slides in from the left; the rounded track clips it, so the end stays round.
        style={{ transform: `translateX(${percentage - 100}%)` }}
      />
    </div>
  );
}
