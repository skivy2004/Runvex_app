import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonStyle = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:brightness-95",
  secondary: "bg-surface-raised text-foreground hover:bg-line",
};

/**
 * The button look as a class string, so a <Link> can look like a button too.
 * Use a link when it goes to another page, a button when it does something.
 */
export function buttonClassName({ variant = "primary", fullWidth = false }: ButtonStyle = {}) {
  return `inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""}`;
}

export function Button({
  variant,
  fullWidth,
  // Default to "button": inside a <form>, a plain <button> submits the form.
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClassName({ variant, fullWidth })} ${className}`}
      {...props}
    />
  );
}
