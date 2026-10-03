import type { HTMLAttributes } from "react";

/** A glass card: slightly see-through with a 1px light border, like in the design. */
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[1.75rem] border border-white/[0.08] bg-surface/70 p-5 backdrop-blur-xl ${className}`}
      {...props}
    />
  );
}
