type StepHeadingProps = {
  title: string;
  subtitle?: string;
};

export function StepHeading({ title, subtitle }: StepHeadingProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </div>
  );
}
