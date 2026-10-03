"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

/** Deleting can't be undone, so you type a word to confirm it. */
export function DeleteAccountForm() {
  const t = useTranslations("DeleteAccount");
  const [confirmation, setConfirmation] = useState("");
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const confirmed = confirmation.trim().toUpperCase() === t("confirmWord").toUpperCase();

  function remove() {
    setFailed(false);
    startTransition(async () => {
      // On success the action logs out and goes to the login page.
      const result = await deleteAccountAction();
      if (!result.ok) setFailed(true);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
        <li>{t("whatGoes1")}</li>
        <li>{t("whatGoes2")}</li>
        <li>{t("whatGoes3")}</li>
      </ul>

      <TextField
        label={t("confirmLabel", { word: t("confirmWord") })}
        autoComplete="off"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
      />

      {failed && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t("failed")}
        </p>
      )}

      <Button type="button" variant="danger" fullWidth disabled={!confirmed || isPending} onClick={remove}>
        <Trash2 aria-hidden className="size-4" />
        {t("button")}
      </Button>
    </div>
  );
}
