import { LogOut } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/(guest)/actions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { PageHeading } from "@/components/PageHeading";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getRequestClient, getRequestProfile } from "@/lib/currentUser";
import { getWeeklyAvailability } from "@/services/availability";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const supabase = await getRequestClient();
  const [{ data: auth }, profile] = await Promise.all([
    supabase.auth.getClaims(),
    getRequestProfile(),
  ]);
  if (!profile) return null;

  const availability = await getWeeklyAvailability(supabase, profile.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t("title")} subtitle={auth?.claims.email} />

      <ProfileSettings
        displayName={profile.display_name}
        dateOfBirth={profile.date_of_birth}
        availability={availability.map((day) => day.minutes)}
      />

      <Card className="flex items-center justify-between gap-4">
        <span className="font-semibold">{t("language")}</span>
        <LanguageSwitcher />
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="secondary" fullWidth>
          <LogOut aria-hidden className="size-4" />
          {t("logout")}
        </Button>
      </form>

      <Link href="/privacy" className="self-center text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
        {t("privacy")}
      </Link>
    </div>
  );
}
