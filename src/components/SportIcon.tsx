import { Bike, Dumbbell, Footprints, WavesHorizontal, type LucideIcon } from "lucide-react";
import type { Sport } from "@/core/training";
import { sportColors } from "./sportColors";

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

export const sportIcons = icons;

/** A rounded badge with the sport's icon in the sport's color. Decorative: the sport name is always available as text too. */
export function SportIcon({ sport, small = false, className = "" }: SportIconProps) {
  const Icon = icons[sport];
  const color = sportColors[sport];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center ${small ? "rounded-full" : "rounded-xl"} ${color.soft} ${color.text} ${
        small ? "size-6" : "size-10"
      } ${className}`}
    >
      <Icon className={small ? "size-3.5" : "size-5"} />
    </span>
  );
}
