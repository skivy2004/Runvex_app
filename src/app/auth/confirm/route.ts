import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup", "recovery"];

function isAllowedType(value: string | null): value is EmailOtpType {
  return ALLOWED_TYPES.includes(value as EmailOtpType);
}

/**
 * The link in the confirmation email ends up here and logs the user in.
 * Two formats are supported:
 * - `?code=...`: Supabase's default email template. Only works in the browser
 *   where the user signed up, because it needs a secret stored in a cookie then.
 * - `?token_hash=...&type=email`: a custom template (needs custom SMTP). Works
 *   in any browser. We switch to this before launch.
 * The redirect target is fixed on purpose: taking it from the URL would let
 * attackers craft links that send people to a malicious site.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/");
  } else if (tokenHash && isAllowedType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    // A "forgot password" link: you're logged in now, so choose a new password.
    if (!error) redirect(type === "recovery" ? "/reset-password" : "/");
  }

  redirect("/login?error=confirmation");
}
