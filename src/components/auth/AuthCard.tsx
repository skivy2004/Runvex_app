import { ArrowRight, Bike, Footprints, WavesHorizontal } from "lucide-react";
import type { ReactNode } from "react";

/** The glass card behind the login, register and password forms. */
export const authCardClass =
  "flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl";

/** While sending: swim, bike and run take turns inside the button. */
function SportCycle() {
  return (
    <span aria-hidden className="relative size-5">
      {[WavesHorizontal, Bike, Footprints].map((Icon, index) => (
        <Icon key={index} className="sport-cycle absolute inset-0 size-5" style={{ animationDelay: `${index * 0.4}s` }} />
      ))}
    </span>
  );
}

/** The big Burnt Coral button with an arrow, and the sports cycling while it's busy. */
export function AuthSubmit({ isPending, children }: { isPending: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      aria-busy={isPending}
      className="auth-cta mt-1 flex h-14 w-full items-center justify-between rounded-2xl bg-accent px-6 text-base font-bold text-accent-foreground transition active:scale-[0.96] disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
      {isPending ? <SportCycle /> : <ArrowRight aria-hidden className="size-5" />}
    </button>
  );
}
