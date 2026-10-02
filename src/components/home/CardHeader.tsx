import { ChevronRight } from "lucide-react";
import Link from "next/link";

type CardHeaderProps = {
  title: string;
  /** Optional "See all"-style link in the top right corner. */
  link?: { href: string; label: string };
};

export function CardHeader({ title, link }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">{title}</h2>
      {link && (
        <Link
          href={link.href}
          prefetch
          className="flex items-center gap-0.5 text-sm font-semibold text-accent hover:underline"
        >
          {link.label}
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      )}
    </div>
  );
}
