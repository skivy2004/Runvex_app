import { getTranslations } from "next-intl/server";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getTranslations("Auth");
  // Set by /auth/confirm when a confirmation link didn't work,
  // and after deleting your account.
  const { error, deleted } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      {error === "confirmation" && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t("confirmationFailed")}
        </p>
      )}
      {deleted === "1" && (
        <p role="status" className="rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">
          {t("accountDeleted")}
        </p>
      )}
      <AuthForm mode="login" />
    </div>
  );
}
