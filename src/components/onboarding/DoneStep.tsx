"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";

type DoneStepProps = {
  name: string;
  mode: "onboarding" | "redo";
};

export function DoneStep({ name, mode }: DoneStepProps) {
  const t = useTranslations("Onboarding.done");
  const trimmedName = name.trim();
  const isRedo = mode === "redo";

  const title = isRedo
    ? t("redoTitle")
    : trimmedName
      ? t("titleWithName", { name: trimmedName })
      : t("title");

  return (
    <div className="flex flex-1 flex-col justify-center py-8">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-accent p-8 text-center text-accent-foreground">
        <div
          aria-hidden
          className="flex size-20 items-center justify-center rounded-full bg-accent-foreground text-4xl text-accent ring-8 ring-accent-foreground/15"
        >
          ✓
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm">{t(isRedo ? "redoText" : "text")}</p>
        </div>
        <Link
          href={isRedo ? "/profile" : "/"}
          className={`${buttonClassName({ fullWidth: true })} bg-accent-foreground text-foreground hover:brightness-125`}
        >
          {t(isRedo ? "redoButton" : "button")}
        </Link>
      </div>
    </div>
  );
}
