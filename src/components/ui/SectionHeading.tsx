import Link from "next/link";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  link?: { href: string; label: string };
};

export function SectionHeading({ eyebrow, title, link }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div className="flex flex-col gap-1">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} prefetch className="pb-1 text-sm font-bold text-accent">
          {link.label}
        </Link>
      )}
    </div>
  );
}
