type PageHeadingProps = {
  title: string;
  subtitle?: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
};

export function PageHeading({ title, subtitle, eyebrow }: PageHeadingProps) {
  return (
    <header className="flex flex-col gap-1.5">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </header>
  );
}
