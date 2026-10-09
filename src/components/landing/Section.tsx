import type { ReactNode } from "react";

/** The page width from the design: 1200px of content, with side padding on smaller screens. */
export function Container({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[75rem] px-5 sm:px-8 xl:px-0 ${className}`}>{children}</div>;
}

/** The small coral label above a heading. */
export function Eyebrow({ className = "text-lp-coral", children }: { className?: string; children: ReactNode }) {
  return <p className={`text-sm font-medium uppercase tracking-[0.12em] ${className}`}>{children}</p>;
}

/** A section heading in Gambarino. */
export function Heading({ className = "text-lp-chalk", children }: { className?: string; children: ReactNode }) {
  return (
    <h2 className={`max-w-[60rem] font-display text-[2.75rem] leading-none tracking-[-0.02em] sm:text-6xl lg:text-[4.5rem] ${className}`}>
      {children}
    </h2>
  );
}

/** A full-width band with the design's vertical spacing. */
export function Band({ id, className = "bg-lp-bg", children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-[72px] py-24 sm:py-32 lg:py-[8.75rem] ${className}`}>
      {children}
    </section>
  );
}
