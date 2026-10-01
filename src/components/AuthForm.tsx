"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { signIn, signUp } from "@/app/(guest)/actions";
import { initialAuthFormState } from "@/app/(guest)/form-state";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
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

  if (state.status === "check-email") {
    return (
      <Card className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-bold">{t("checkEmailTitle")}</h1>
        <p className="text-sm text-muted">{t("checkEmailText", { email: state.email })}</p>
      </Card>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t(isRegister ? "registerTitle" : "loginTitle")}</h1>
        <p className="text-muted">{t(isRegister ? "registerSubtitle" : "loginSubtitle")}</p>
      </div>

      <div className="flex flex-col gap-4">
        <TextField
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
        />
        <TextField
          label={t("password")}
          name="password"
          type="password"
          // Lets password managers offer to generate or fill in a password.
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
          hint={isRegister ? t("passwordHint", { min: MIN_PASSWORD_LENGTH }) : undefined}
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(`errors.${state.error}`, { min: MIN_PASSWORD_LENGTH })}
        </p>
      )}

      <Button type="submit" fullWidth disabled={isPending}>
        {t(isRegister ? "registerButton" : "loginButton")}
      </Button>

      <p className="text-center text-sm text-muted">
        {t(isRegister ? "haveAccount" : "noAccount")}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-accent">
          {t(isRegister ? "toLogin" : "toRegister")}
        </Link>
      </p>
    </form>
  );
}
