import { User } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { toFormattableDate } from "@/core/dates";

type HomeHeaderProps = {
  name: string | null;
  today: string;
};

export function HomeHeader({ name, today }: HomeHeaderProps) {
  const t = useTranslations("Home");
  const format = useFormatter();

  return (
    <header className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground"
      >
        {name ? name.charAt(0).toUpperCase() : <User className="size-5" />}
      </span>
      <div className="flex flex-col">
        <h1 className="text-xl font-bold">
          {name ? t("greeting", { name }) : t("greetingNoName")}
        </h1>
        <p className="text-sm text-muted first-letter:uppercase">
          {/* timeZone "UTC" because `today` is already the user's local date. */}
          {format.dateTime(toFormattableDate(today), {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          })}
        </p>
      </div>
    </header>
  );
}
