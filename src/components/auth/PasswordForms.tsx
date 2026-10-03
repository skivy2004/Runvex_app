"use client";

import { Lock, Mail, MailCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { requestPasswordReset, updatePassword } from "@/app/(guest)/actions";
import { initialAuthFormState } from "@/app/(guest)/form-state";
import { MIN_PASSWORD_LENGTH } from "@/core/validation/auth";
import { authCardClass, AuthSubmit } from "./AuthCard";
import { AuthField } from "./AuthField";

/** Step 1 of "forgot password": your email, then a link arrives by email. */
export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialAuthFormState);

  if (state.status === "reset-sent") {
    return (
      <div className={`${authCardClass} items-center text-center`}>
        <MailCheck aria-hidden className="size-8 text-accent" />
        <h2 className="text-xl font-bold">{t("checkEmailTitle")}</h2>
        <p className="text-sm text-muted">{t("forgotSentText", { email: state.email })}</p>
        <Link href="/login" className="text-sm font-bold text-accent">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className={authCardClass}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">{t("forgotTitle")}</h2>
        <p className="text-sm text-muted">{t("forgotText")}</p>
      </div>
      <AuthField
        label={t("email")}
        icon={Mail}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.error}`, { min: MIN_PASSWORD_LENGTH })}
        </p>
      )}
      <AuthSubmit isPending={isPending}>{t("forgotButton")}</AuthSubmit>
      <Link href="/login" className="text-center text-sm font-bold text-accent">
        {t("backToLogin")}
      </Link>
    </form>
  );
}

/** Step 2: after the email link you're logged in and choose a new password. */
export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(updatePassword, initialAuthFormState);

  return (
    <form action={formAction} className={authCardClass}>
      <h2 className="text-lg font-bold">{t("resetTitle")}</h2>
      <AuthField
        label={t("newPassword")}
        icon={Lock}
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        hint={t("passwordHint", { min: MIN_PASSWORD_LENGTH })}
      />
      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.error}`, { min: MIN_PASSWORD_LENGTH })}
        </p>
      )}
      <AuthSubmit isPending={isPending}>{t("resetButton")}</AuthSubmit>
    </form>
  );
}
