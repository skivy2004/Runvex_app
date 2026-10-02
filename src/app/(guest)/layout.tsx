import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

// Shared frame for the login and register pages.
export default async function GuestLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("Profile");
  return (
    <main className="flex flex-1 flex-col pb-8">
      <header className="flex items-center justify-between pt-4">
        <Logo className="text-lg" />
        <LanguageSwitcher />
      </header>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
      <Link href="/privacy" className="mt-6 self-center text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
        {t("privacy")}
      </Link>
    </main>
  );
}
