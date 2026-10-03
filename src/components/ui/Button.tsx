import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonStyle = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle;

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground shadow-[0_0_24px_rgb(239_106_69/0.25)] hover:brightness-95",
  secondary: "border border-white/10 bg-white/[0.05] text-foreground hover:bg-white/[0.09]",
  // For actions that can't be undone, like deleting your account.
  danger: "bg-danger text-background hover:brightness-95",
};

/**
 * The button look as a class string, so a <Link> can look like a button too.
 * Use a link when it goes to another page, a button when it does something.
 */
export function buttonClassName({ variant = "primary", fullWidth = false }: ButtonStyle = {}) {
  return `inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${fullWidth ? "w-full" : ""}`;
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
