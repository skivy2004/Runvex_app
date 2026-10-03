"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  const t = useTranslations("Print");
  return (
    <Button type="button" fullWidth onClick={() => window.print()}>
      <Printer aria-hidden className="size-4" />
      {t("print")}
    </Button>
  );
}
