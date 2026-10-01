import { Bike, Dumbbell, Footprints, WavesHorizontal, type LucideIcon } from "lucide-react";
import type { Sport } from "@/core/training";

const icons: Record<Sport, LucideIcon> = {
  running: Footprints,
  cycling: Bike,
  swimming: WavesHorizontal,
  strength: Dumbbell,
};

type SportIconProps = {
  sport: Sport;
  /** A smaller version, e.g. for a row of icons next to a day. */
  small?: boolean;
  className?: string;
};

/** A round badge with the sport's icon. Decorative: the sport name is always available as text too. */
export function SportIcon({ sport, small = false, className = "" }: SportIconProps) {
  const Icon = icons[sport];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent ${
        small ? "size-6" : "size-10"
      } ${className}`}
    >
      <Icon className={small ? "size-3.5" : "size-5"} />
    </span>
  );
}
