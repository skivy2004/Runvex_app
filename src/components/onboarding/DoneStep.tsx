"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DoneStep({ name }: { name: string }) {
  const t = useTranslations("Onboarding.done");
  const router = useRouter();
  const trimmedName = name.trim();

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
          <h1 className="text-2xl font-bold">
            {trimmedName ? t("titleWithName", { name: trimmedName }) : t("title")}
          </h1>
          <p className="text-sm">{t("text")}</p>
        </div>
        <Button
          fullWidth
          onClick={() => router.push("/")}
          className="bg-accent-foreground text-foreground hover:brightness-125"
        >
          {t("button")}
        </Button>
      </div>
    </div>
  );
}
