import { getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { BackLink } from "@/components/profile/BackLink";
import { ProfileDetailsForm } from "@/components/profile/ProfileDetailsForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profile";

export default async function ProfileDetailsPage() {
  const t = await getTranslations("Profile");
  const profile = await getCurrentProfile(await createClient());
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/profile" label={t("title")} />
      <PageHeading title={t("details")} subtitle={t("detailsText")} />
      <ProfileDetailsForm
        displayName={profile.display_name ?? ""}
        dateOfBirth={profile.date_of_birth ?? ""}
      />
    </div>
  );
}
