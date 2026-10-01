type ChoiceCardProps = {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  /** "radio" when only one option can be chosen, "checkbox" when several can. */
  kind: "radio" | "checkbox";
};

export function ChoiceCard({ title, description, selected, onSelect, kind }: ChoiceCardProps) {
  return (
    <button
      type="button"
      role={kind}
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-accent ${
        selected ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-muted"
      }`}
    >
      <span className="font-semibold">{title}</span>
      {description && <span className="text-sm text-muted">{description}</span>}
    </button>
  );
}
