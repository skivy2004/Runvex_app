"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { saveProfileDetails, type DetailsFormState } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { latestDateOfBirthForAge } from "@/core/age";
import { MIN_AGE } from "@/core/validation/onboarding";

type ProfileDetailsFormProps = {
  displayName: string;
  dateOfBirth: string;
};

const initialState: DetailsFormState = { error: null };

export function ProfileDetailsForm({ displayName, dateOfBirth }: ProfileDetailsFormProps) {
  const t = useTranslations("Profile");
  const tAbout = useTranslations("Onboarding.about");
  const [state, formAction, isPending] = useActionState(saveProfileDetails, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        label={tAbout("name")}
        hint={tAbout("nameHint")}
        name="displayName"
        autoComplete="given-name"
        maxLength={80}
        defaultValue={displayName}
      />
      <TextField
        label={tAbout("dateOfBirth")}
        name="dateOfBirth"
        type="date"
        autoComplete="bday"
        required
        min="1900-01-01"
        max={latestDateOfBirthForAge(MIN_AGE)}
        defaultValue={dateOfBirth}
      />

      {state.error && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error === "tooYoung"
            ? tAbout("tooYoung", { minAge: MIN_AGE })
            : t(state.error === "invalid" ? "invalidDetails" : "saveFailed")}
        </p>
      )}

      <Button type="submit" fullWidth disabled={isPending}>
        {t("save")}
      </Button>
    </form>
  );
}
