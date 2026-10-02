import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { addDays, toFormattableDate } from "@/core/dates";

type WeekNavigationProps = {
  weekStart: string;
  isCurrentWeek: boolean;
};

const arrowClassName =
  "flex size-10 items-center justify-center rounded-full bg-surface text-foreground transition hover:bg-surface-raised";

export function WeekNavigation({ weekStart, isCurrentWeek }: WeekNavigationProps) {
  const t = useTranslations("Week");
  const format = useFormatter();
  // Each week has its own URL, so the browser's back button and bookmarks work.
  const weekHref = (offsetDays: number) => `/week?week=${addDays(weekStart, offsetDays)}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <Link href={weekHref(-7)} prefetch aria-label={t("previousWeek")} className={arrowClassName}>
        <ChevronLeft aria-hidden className="size-5" />
      </Link>

      <div className="flex flex-col items-center">
        <p className="font-semibold">
          {format.dateTimeRange(toFormattableDate(weekStart), toFormattableDate(addDays(weekStart, 6)), {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          })}
        </p>
        {isCurrentWeek ? (
          <span className="text-xs text-accent">{t("thisWeek")}</span>
        ) : (
          <Link href="/week" prefetch className="text-xs text-muted underline hover:text-foreground">
            {t("backToThisWeek")}
          </Link>
        )}
      </div>

      <Link href={weekHref(7)} prefetch aria-label={t("nextWeek")} className={arrowClassName}>
        <ChevronRight aria-hidden className="size-5" />
      </Link>
    </div>
  );
}
