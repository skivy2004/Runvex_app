"use client";

import { Check, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: LucideIcon;
  hint?: string;
  /** Extra content under the field, e.g. whether two passwords match. */
  below?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

/**
 * An input with an icon and a floating label: the label sits inside the field and
 * moves up when you type. A check appears when the value is valid. Password fields
 * get an eye to show what you typed.
 */
export function AuthField({ label, icon: Icon, hint, below, type, ...props }: AuthFieldProps) {
  const t = useTranslations("Auth");
  const id = useId();
  const hintId = `${id}-hint`;
  const isPassword = type === "password";
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          id={id}
          type={isPassword && isVisible ? "text" : type}
          // A space as placeholder lets CSS see whether the field is empty (:placeholder-shown).
          placeholder=" "
          aria-describedby={hint ? hintId : undefined}
          className={`peer h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pt-4 text-foreground outline-none transition focus:border-accent focus:shadow-[0_0_0_4px_rgb(239_106_69/0.12)] ${
            isPassword ? "pr-20" : "pr-11"
          }`}
          {...props}
        />
        <Icon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted transition peer-focus:text-accent"
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute top-1/2 left-12 -translate-y-1/2 text-muted transition-all peer-focus:top-4 peer-focus:text-xs peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-xs"
        >
          {label}
        </label>
        <Check
          aria-hidden
          className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 scale-50 text-accent opacity-0 transition peer-[:valid:not(:placeholder-shown)]:scale-100 peer-[:valid:not(:placeholder-shown)]:opacity-100 ${
            isPassword ? "right-12" : "right-4"
          }`}
          strokeWidth={3}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={t(isVisible ? "hidePassword" : "showPassword")}
            aria-pressed={isVisible}
            className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            {isVisible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="pl-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {below}
    </div>
  );
}
