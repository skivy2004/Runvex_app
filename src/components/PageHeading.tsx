type PageHeadingProps = {
  title: string;
  subtitle?: string;
};

export function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </header>
  );
}
