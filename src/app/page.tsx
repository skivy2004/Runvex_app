import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(guest)/actions";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profile";

// Temporary start page until we build Home in step 7.
export default async function Home() {
  const t = await getTranslations("Home");
  const profile = await getCurrentProfile(await createClient());

  // New users first fill in the intake.
  if (profile && !profile.onboarding_completed_at) redirect("/onboarding");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1>
        <Logo className="text-4xl" />
      </h1>
      <p className="text-lg font-semibold">
        {profile?.display_name ? t("greeting", { name: profile.display_name }) : t("greetingNoName")}
      </p>
      <p className="text-muted">{t("tagline")}</p>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          {t("logout")}
        </Button>
      </form>
      <Link href="/styleguide" className="text-sm text-muted underline">
        {t("openStyleguide")}
      </Link>
    </main>
  );
}
