import { getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { Card } from "@/components/ui/Card";

// Placeholder: the goal overview comes after the week view.
export default async function GoalPage() {
  const t = await getTranslations("Goal");

  return (
    <div className="flex flex-col gap-6">
      <PageHeading title={t("title")} />
      <Card className="text-muted">{t("comingSoon")}</Card>
    </div>
  );
}
