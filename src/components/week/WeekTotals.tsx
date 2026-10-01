import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useFormatDuration } from "@/components/useFormatDuration";

type WeekTotalsProps = {
  plannedMinutes: number;
  availableMinutes: number;
};

export function WeekTotals({ plannedMinutes, availableMinutes }: WeekTotalsProps) {
  const t = useTranslations("Week");
  const formatDuration = useFormatDuration();

  return (
    <Card className="flex flex-col gap-3 py-4">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span>
          <span className="text-lg font-bold text-accent">{formatDuration(plannedMinutes)}</span>{" "}
          <span className="text-muted">{t("planned")}</span>
        </span>
        <span className="text-muted">
          {t("available", { duration: formatDuration(availableMinutes) })}
        </span>
      </p>
      <ProgressBar value={plannedMinutes} max={availableMinutes} label={t("progressLabel")} />
    </Card>
  );
}
