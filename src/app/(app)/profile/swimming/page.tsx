import { getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { BackLink } from "@/components/profile/BackLink";
import { SwimSettingsForm } from "@/components/profile/SwimSettingsForm";
import { swimSettingsOf } from "@/core/validation/swim";
import { getRequestProfile } from "@/lib/currentUser";

export default async function SwimSettingsPage() {
  const t = await getTranslations("SwimSettings");
  const tProfile = await getTranslations("Profile");
  const profile = await getRequestProfile();
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/profile" label={tProfile("title")} />
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <SwimSettingsForm {...swimSettingsOf(profile)} />
    </div>
  );
}
