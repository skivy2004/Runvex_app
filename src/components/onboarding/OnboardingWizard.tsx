"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { saveIntakeAgain } from "@/app/intake/actions";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  initialDraft,
  isStepComplete,
  onboardingSteps,
  redoSteps,
  toOnboardingInput,
  toTrainingProfileInput,
  type OnboardingDraft,
} from "./draft";
import { DoneStep } from "./DoneStep";
import { GoalStep } from "./GoalStep";
import { AboutStep, AvailabilityStep, LevelsStep, SportsStep, WorkStep } from "./steps";

type OnboardingWizardProps = {
  /** "onboarding" = first time, "redo" = changing the answers later. */
  mode?: "onboarding" | "redo";
  /** Answers to start with, e.g. the current ones when redoing the intake. */
  startDraft?: OnboardingDraft;
};

export function OnboardingWizard({ mode = "onboarding", startDraft = initialDraft }: OnboardingWizardProps) {
  const t = useTranslations("Onboarding");
  const [draft, setDraft] = useState<OnboardingDraft>(startDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const steps = mode === "redo" ? redoSteps : onboardingSteps;
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const progressText = t("progress", { current: stepIndex + 1, total: steps.length });

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
      const result =
        mode === "redo"
          ? await saveIntakeAgain(toTrainingProfileInput(draft))
          : await completeOnboarding(toOnboardingInput(draft));
      if (result.ok) setIsDone(true);
      else setSaveFailed(true);
    });
  }

  if (isDone) return <DoneStep name={draft.displayName} mode={mode} />;

  const stepProps = { draft, onChange: update };

  return (
    <div className="flex flex-1 flex-col gap-8 pt-6">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{progressText}</span>
          {mode === "redo" && (
            <Link
              href="/profile"
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <X aria-hidden className="size-4" />
              {t("cancel")}
            </Link>
          )}
        </div>
        <ProgressBar value={stepIndex + 1} max={steps.length} label={progressText} />
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
            {t(isLastStep ? (mode === "redo" ? "save" : "finish") : "next")}
          </Button>
        </div>
      </footer>
    </div>
  );
}
