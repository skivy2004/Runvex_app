"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale } from "@/core/locale";
import { loginSchema, registerSchema } from "@/core/validation/auth";
import { writeLocaleCookie } from "@/i18n/cookie";
import { createClient } from "@/lib/supabase/server";
import type { AuthErrorKey, AuthFormState } from "./form-state";

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = registerSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { status: "error", error: field === "password" ? "passwordTooShort" : "invalidEmail", email };
  }

  const supabase = await createClient();
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
  if (error) return { status: "error", error: toErrorKey(error.code), email };

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

  // redirect() works by throwing, so never call it inside try/catch.
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
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
