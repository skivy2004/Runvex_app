import { ResetPasswordForm } from "@/components/auth/PasswordForms";

// You get here from the "forgot password" email, which logged you in. The proxy
// sends anyone who isn't logged in to /login.
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
