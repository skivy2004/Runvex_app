import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthBackground } from "@/components/auth/AuthBackground";
import { AuthHero } from "@/components/auth/AuthHero";
import { SportDots } from "@/components/auth/SportDots";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";

// Shared frame for the login and register pages: moving background, headline,
// the form card (the page) and swim, bike and run at the bottom.
export default async function GuestLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("Profile");
  return (
    <main className="flex flex-1 flex-col gap-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <AuthBackground />
      <header className="flex items-center justify-between">
        <Logo className="text-lg uppercase tracking-tight" />
        <LanguageSwitcher />
      </header>

      <div className="flex flex-1 flex-col justify-center gap-7">
        <AuthHero />
        {children}
      </div>

      <div className="flex flex-col items-center gap-5">
        <SportDots />
        <Link href="/privacy" className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
          {t("privacy")}
        </Link>
      </div>
    </main>
  );
}
