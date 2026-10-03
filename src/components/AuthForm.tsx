"use client";

import { Lock, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";
import { signIn, signUp } from "@/app/(guest)/actions";
import { initialAuthFormState } from "@/app/(guest)/form-state";
import { authCardClass as cardClass, AuthSubmit } from "@/components/auth/AuthCard";
import { AuthField } from "@/components/auth/AuthField";
import { PasswordMatch } from "@/components/auth/PasswordMatch";
import { MIN_PASSWORD_LENGTH } from "@/core/validation/auth";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const t = useTranslations("Auth");
  const isRegister = mode === "register";
  // useActionState runs the Server Action and gives us its latest result.
  const [state, formAction, isPending] = useActionState(
    isRegister ? signUp : signIn,
    initialAuthFormState,
  );
  // Register: the password twice, checked while you type.
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const confirmationRef = useRef<HTMLInputElement>(null);
  const passwordsMatch = password === confirmation;
  // The browser blocks sending the form (and says why) while they differ.
  useEffect(() => {
    confirmationRef.current?.setCustomValidity(passwordsMatch ? "" : t("passwordsDontMatch"));
  }, [passwordsMatch, t]);

  if (state.status === "check-email") {
    return (
      <div className={`${cardClass} items-center text-center`}>
        <MailCheck aria-hidden className="size-8 text-accent" />
        <h2 className="text-xl font-bold">{t("checkEmailTitle")}</h2>
        <p className="text-sm text-muted">{t("checkEmailText", { email: state.email })}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className={cardClass}>
      {/* The big headline is shared; this names what the card does for screen readers and on register. */}
      <h2 className={isRegister ? "text-lg font-bold" : "sr-only"}>
        {t(isRegister ? "registerTitle" : "loginTitle")}
      </h2>

      <AuthField
        label={t("email")}
        icon={Mail}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      <AuthField
        label={t("password")}
        icon={Lock}
        name="password"
        type="password"
        // Lets password managers offer to generate or fill in a password.
        autoComplete={isRegister ? "new-password" : "current-password"}
        required
        minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
        hint={isRegister ? t("passwordHint", { min: MIN_PASSWORD_LENGTH }) : undefined}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {isRegister && (
        <AuthField
          ref={confirmationRef}
          label={t("repeatPassword")}
          icon={Lock}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          below={<PasswordMatch password={password} confirmation={confirmation} />}
        />
      )}
      {!isRegister && (
        <Link href="/forgot-password" className="-mt-2 self-end text-xs font-bold text-accent">
          {t("forgotLink")}
        </Link>
      )}

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.error}`, { min: MIN_PASSWORD_LENGTH })}
        </p>
      )}

      <AuthSubmit isPending={isPending}>{t(isRegister ? "registerButton" : "letsGo")}</AuthSubmit>

      <p className="text-center text-sm text-muted">
        {t(isRegister ? "haveAccount" : "noAccountYet")}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="font-bold text-accent">
          {t(isRegister ? "toLogin" : "createAccount")}
        </Link>
      </p>
    </form>
  );
}
