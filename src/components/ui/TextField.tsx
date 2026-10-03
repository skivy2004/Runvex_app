import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function TextField({ label, hint, className = "", ...props }: TextFieldProps) {
  // Unique ids link the label and hint to the input for screen readers.
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? hintId : undefined}
        className={`h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_4px_rgb(239_106_69/0.12)] ${className}`}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
