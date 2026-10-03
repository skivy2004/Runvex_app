import type { ReactNode } from "react";

type ProgressRingProps = {
  /** 0 to 1. */
  value: number;
  /** Tailwind stroke class, e.g. "stroke-accent". */
  strokeClass: string;
  size?: number;
  thickness?: number;
  /** Shown in the middle. */
  children?: ReactNode;
  label: string;
};

/** A circular progress ring. It fills from 0 to its value when it appears (.ring-fill in globals.css). */
export function ProgressRing({ value, strokeClass, size = 72, thickness = 6, children, label }: ProgressRingProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)));

  return (
    <div role="img" aria-label={label} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={thickness} className="stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          className={`ring-fill ${strokeClass}`}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset, ["--ring-from" as string]: circumference }}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}
