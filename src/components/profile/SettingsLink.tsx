import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

type SettingsLinkProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  /** Current value or short explanation, shown under the title. */
  description?: string;
};

/** One row in the settings list that opens a page to change something. */
export function SettingsLink({ href, icon: Icon, title, description }: SettingsLinkProps) {
  return (
    <Link
      href={href}
      prefetch
      className="flex items-center gap-3 rounded-[1.5rem] border border-white/[0.08] bg-surface/70 backdrop-blur-xl p-4 transition hover:bg-surface-raised/70 active:scale-[0.98]"
    >
      <span
        aria-hidden
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"
      >
        <Icon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">{title}</span>
        {description && <span className="truncate text-sm text-muted">{description}</span>}
      </span>
      <ChevronRight aria-hidden className="size-5 text-muted" />
    </Link>
  );
}
