import type { ReactNode } from "react";

// Building blocks shared by the admin dashboard tabs (lp-* color tokens in globals.css).

/** Coral eyebrow + Gambarino title, like the landing page section headings. */
export function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-10 flex flex-col gap-4">
      <p className="text-sm font-medium tracking-[0.12em] text-lp-coral uppercase">{eyebrow}</p>
      <h1 className="font-display text-[2.75rem] leading-none tracking-[-0.02em] sm:text-6xl">{title}</h1>
      <p className="text-lg text-lp-pink">{subtitle}</p>
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl bg-lp-card p-6 sm:p-8 ${className}`}>
      {title && <h3 className="mb-6 font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em]">{title}</h3>}
      {children}
    </div>
  );
}
