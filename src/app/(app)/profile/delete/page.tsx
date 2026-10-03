import { getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { BackLink } from "@/components/profile/BackLink";
import { DeleteAccountForm } from "@/components/profile/DeleteAccountForm";

export default async function DeleteAccountPage() {
  const t = await getTranslations("DeleteAccount");
  const tProfile = await getTranslations("Profile");

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/profile" label={tProfile("title")} />
      <PageHeading title={t("title")} subtitle={t("subtitle")} />
      <DeleteAccountForm />
    </div>
  );
}
