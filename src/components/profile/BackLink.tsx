import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch
      className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
    >
      <ChevronLeft aria-hidden className="size-4" />
      {label}
    </Link>
  );
}
