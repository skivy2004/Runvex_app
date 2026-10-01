"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  initialDraft,
  isStepComplete,
  onboardingSteps,
  toOnboardingInput,
  type OnboardingDraft,
} from "./draft";
import { DoneStep } from "./DoneStep";
import { GoalStep } from "./GoalStep";
import { AboutStep, AvailabilityStep, LevelsStep, SportsStep, WorkStep } from "./steps";

export function OnboardingWizard() {
  const t = useTranslations("Onboarding");
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const step = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;

  function update(changes: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function goTo(index: number) {
    setStepIndex(index);
    window.scrollTo({ top: 0 });
  }

  function handleNext() {
    if (!isLastStep) {
      goTo(stepIndex + 1);
      return;
    }

    setSaveFailed(false);
    startSaving(async () => {
      const result = await completeOnboarding(toOnboardingInput(draft));
      if (result.ok) setIsDone(true);
      else setSaveFailed(true);
    });
  }

  if (isDone) return <DoneStep name={draft.displayName} />;

  const stepProps = { draft, onChange: update };

  return (
    <div className="flex flex-1 flex-col gap-8 pt-6">
      <header className="flex flex-col gap-3">
        <span className="text-xs text-muted">
          {t("progress", { current: stepIndex + 1, total: onboardingSteps.length })}
        </span>
        <ProgressBar
          value={stepIndex + 1}
          max={onboardingSteps.length}
          label={t("progress", { current: stepIndex + 1, total: onboardingSteps.length })}
        />
      </header>

      <div className="flex-1">
        {step === "about" && <AboutStep {...stepProps} />}
        {step === "sports" && <SportsStep {...stepProps} />}
        {step === "levels" && <LevelsStep {...stepProps} />}
        {step === "goal" && <GoalStep {...stepProps} />}
        {step === "work" && <WorkStep {...stepProps} />}
        {step === "availability" && <AvailabilityStep {...stepProps} />}
      </div>

      {/* Stays visible at the bottom of the screen while scrolling. */}
      <footer className="sticky bottom-0 flex flex-col gap-3 bg-background pt-2 pb-6">
        {saveFailed && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {t("saveFailed")}
          </p>
        )}
        <div className="flex gap-3">
          {stepIndex > 0 && (
            <Button
              variant="secondary"
              className="flex-1"
              disabled={isSaving}
              onClick={() => goTo(stepIndex - 1)}
            >
              {t("previous")}
            </Button>
          )}
          <Button
            className="flex-1"
            disabled={!isStepComplete(step, draft) || isSaving}
            onClick={handleNext}
          >
            {t(isLastStep ? "finish" : "next")}
          </Button>
        </div>
      </footer>
    </div>
  );
}
