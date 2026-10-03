import { Bike, Footprints, Sparkles, WavesHorizontal, type LucideIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { agentNames, type AgentId } from "@/core/coach/agents";
import { isLocale } from "@/core/locale";
import type { ReactNode } from "react";

const agentLooks: Record<AgentId, { icon: LucideIcon; tile: string }> = {
  head: { icon: Sparkles, tile: "bg-gradient-to-br from-blue to-coral text-foreground" },
  running: { icon: Footprints, tile: "bg-coral/15 text-coral" },
  cycling: { icon: Bike, tile: "bg-foreground/10 text-foreground" },
  swimming: { icon: WavesHorizontal, tile: "bg-blue/25 text-blue-light" },
};

type CoachBubbleProps = {
  /** null: the athlete's own message. */
  agent: AgentId | null;
  children: ReactNode;
  /** Under the text, e.g. a proposal. */
  footer?: ReactNode;
};

/** One message: a coach's on the left with its icon and name, the athlete's on the right. */
export function CoachBubble({ agent, children, footer }: CoachBubbleProps) {
  const rawLocale = useLocale();
  const locale = isLocale(rawLocale) ? rawLocale : "en";

  if (agent === null) {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-line rounded-[1.25rem] rounded-br-md bg-accent px-4 py-3 text-[15px] leading-relaxed text-accent-foreground">
          {children}
        </p>
      </div>
    );
  }

  const { icon: Icon, tile } = agentLooks[agent];
  return (
    <div className="flex items-start gap-2.5">
      <span aria-hidden className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tile}`}>
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 max-w-[85%] flex-col gap-1">
        <p className="eyebrow">{agentNames[agent][locale]}</p>
        <div className="rounded-[1.25rem] rounded-tl-md border border-white/[0.08] bg-surface/70 px-4 py-3 backdrop-blur-xl">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{children}</p>
          {footer}
        </div>
      </div>
    </div>
  );
}
