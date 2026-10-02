import { getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { BackLink } from "@/components/profile/BackLink";
import { getRequestProfile } from "@/lib/currentUser";
import { ProfileDetailsForm } from "@/components/profile/ProfileDetailsForm";

export default async function ProfileDetailsPage() {
  const t = await getTranslations("Profile");
  const profile = await getRequestProfile();
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
