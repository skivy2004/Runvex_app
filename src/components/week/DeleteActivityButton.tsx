"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteActivityAction } from "@/app/(app)/week/activityActions";

/** Removes an uploaded activity (a wrong file). Asks once before it deletes. */
export function DeleteActivityButton({ id }: { id: string }) {
  const t = useTranslations("Activities");
  const [isConfirming, setIsConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="flex size-7 items-center justify-center rounded-full text-muted transition hover:text-foreground active:scale-[0.97]"
      >
        <Trash2 aria-hidden className="size-3.5" />
        <span className="sr-only">{t("delete")}</span>
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs font-semibold">
      {failed && <span role="alert" className="text-danger">{t("deleteFailed")}</span>}
      <button type="button" onClick={() => setIsConfirming(false)} className="text-muted">
        {t("cancel")}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteActivityAction(id);
            setFailed(!result.ok);
          })
        }
        className="rounded-full bg-danger/15 px-2.5 py-1 text-danger disabled:opacity-50"
      >
        {t("confirmDelete")}
      </button>
    </span>
  );
}
