import { Bike, Footprints, WavesHorizontal } from "lucide-react";

const sports = [WavesHorizontal, Bike, Footprints];

/**
 * Swim, bike and run as three dots on a line. One after the other, from left to
 * right, each gets a pulsing glow (see .sport-dot in globals.css). Decorative only.
 */
export function SportDots() {
  return (
    <div aria-hidden className="flex items-center justify-center">
      {sports.map((Icon, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span className="h-px w-12 bg-line" />}
          <span
            className="sport-dot flex size-9 items-center justify-center rounded-full border border-line bg-surface/60 text-muted"
            style={{ animationDelay: `${index * 0.8}s` }}
          >
            <Icon className="size-4" />
          </span>
        </div>
      ))}
    </div>
  );
}
