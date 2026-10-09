"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale } from "@/core/locale";
import { forgotPasswordSchema, loginSchema, newPasswordSchema, registerSchema } from "@/core/validation/auth";
import { writeLocaleCookie } from "@/i18n/cookie";
import { createClient } from "@/lib/supabase/server";
import { refreshAppData } from "@/lib/refreshAppData";
import { getBetaSpotsLeft } from "@/services/beta";
import type { AuthErrorKey, AuthFormState } from "./form-state";

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = registerSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { status: "error", error: field === "password" ? "passwordTooShort" : "invalidEmail", email };
  }
  if (formData.get("confirmPassword") !== parsed.data.password) {
    return { status: "error", error: "passwordsDontMatch", email };
  }

  const supabase = await createClient();
  // The beta has a limited number of spots. The database refuses new accounts
  // when it's full; checking first gives a clear message instead of an error.
  if ((await getBetaSpotsLeft(supabase)) === 0) return { status: "error", error: "betaFull", email };

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      // Picked up by the database trigger to set the profile's language.
      data: { locale: await getLocale() },
      // Where the confirmation link sends the user. Supabase only accepts
      // URLs on its Redirect URLs allow list.
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  });
  if (error) {
    // The last spot went just now: the database trigger refused the account.
    if ((await getBetaSpotsLeft(supabase)) === 0) return { status: "error", error: "betaFull", email };
    return { status: "error", error: toErrorKey(error.code), email };
  }

  // Also returned for an email that already has an account: Supabase then
  // sends no email, so nobody can find out who is registered.
  return { status: "check-email", email: parsed.data.email };
}

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { status: "error", error: field === "email" ? "invalidEmail" : "invalidCredentials", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { status: "error", error: toErrorKey(error.code), email };

  // Once logged in, the language saved in the profile wins.
  const { data: profile } = await supabase
    .from("profiles")
    .select("locale")
    .eq("id", data.user.id)
    .single();
  if (isLocale(profile?.locale)) await writeLocaleCookie(profile.locale);

  // Never show pages that were cached for someone else on this device.
  refreshAppData();
  // redirect() works by throwing, so never call it inside try/catch.
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  refreshAppData();
  redirect("/login");
}

function toErrorKey(code: string | undefined): AuthErrorKey {
  switch (code) {
    case "invalid_credentials":
      return "invalidCredentials";
    case "email_not_confirmed":
      return "emailNotConfirmed";
    case "weak_password":
      return "weakPassword";
    case "same_password":
      return "samePassword";
    case "email_address_invalid":
      return "invalidEmail";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rateLimited";
    default:
      console.error("Unexpected auth error:", code);
      return "generic";
  }
}

/** "Forgot password": sends an email with a link to choose a new password. */
export async function requestPasswordReset(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = forgotPasswordSchema.safeParse({ email });
  if (!parsed.success) return { status: "error", error: "invalidEmail", email };

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // The email template builds the link from this: {{ .RedirectTo }}?token_hash=...&type=recovery
    redirectTo: origin ? `${origin}/auth/confirm` : undefined,
  });
  if (error?.code === "over_email_send_rate_limit" || error?.status === 429) {
    return { status: "error", error: "rateLimited", email };
  }
  if (error) console.error("Password reset email failed:", error.message);

  // Always the same answer, also for an unknown email, so nobody can find out who
  // has an account.
  return { status: "reset-sent", email: parsed.data.email };
}

/** Saves a new password for the user who came in through the reset link. */
export async function updatePassword(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { status: "error", error: "passwordTooShort", email: "" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", error: toErrorKey(error.code), email: "" };

  refreshAppData();
  redirect("/");
}
