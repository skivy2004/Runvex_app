import type { Sport } from "@/core/training";

/** Tailwind classes per sport: text, soft background, solid fill and ring stroke. */
export const sportColors: Record<Sport, { text: string; soft: string; solid: string; stroke: string }> = {
  swimming: { text: "text-blue-light", soft: "bg-blue/25", solid: "bg-blue-light", stroke: "stroke-blue-light" },
  cycling: { text: "text-foreground", soft: "bg-foreground/10", solid: "bg-foreground", stroke: "stroke-foreground" },
  running: { text: "text-coral", soft: "bg-coral/15", solid: "bg-coral", stroke: "stroke-coral" },
  strength: { text: "text-muted", soft: "bg-muted/15", solid: "bg-muted", stroke: "stroke-muted" },
};
