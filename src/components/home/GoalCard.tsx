import { Flag } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { daysBetween } from "@/core/dates";
import type { CurrentGoal } from "@/services/goals";
import { CardHeader } from "./CardHeader";

type GoalCardProps = {
  goal: CurrentGoal | null;
  today: string;
};

export function GoalCard({ goal, today }: GoalCardProps) {
  const t = useTranslations("Home");

  if (!goal) {
    return (
      <Card className="flex flex-col gap-4">
        <CardHeader title={t("goal")} />
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-muted"
          >
            <Flag className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold">{t("noGoal")}</p>
            <p className="text-sm text-muted">{t("noGoalText")}</p>
          </div>
        </div>
        <Link href="/goal" className={buttonClassName({ variant: "secondary", fullWidth: true })}>
          {t("setGoal")}
        </Link>
      </Card>
    );
  }

  const daysToGo = goal.event_date ? daysBetween(today, goal.event_date) : null;

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader title={t("goal")} link={{ href: "/goal", label: t("seeGoal") }} />

      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 text-2xl font-bold">{goal.description}</p>
        {daysToGo !== null &&
          (daysToGo === 0 ? (
            <p className="shrink-0 text-3xl font-bold text-accent">{t("raceDay")}</p>
          ) : (
            <p className="flex shrink-0 flex-col items-end leading-none">
              <span className="text-4xl font-bold text-accent">{daysToGo}</span>
              <span className="mt-1 text-sm text-muted">{t("daysToGo", { days: daysToGo })}</span>
            </p>
          ))}
      </div>
    </Card>
  );
}
