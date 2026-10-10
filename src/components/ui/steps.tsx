"use client";

import { Steps } from "@ark-ui/react/steps";
import { Check } from "lucide-react";
import { useSyncExternalStore } from "react";

export default function BasicSteps() {
  const steps = [1, 2, 3, 4];

  return (
    <div className="bg-white dark:bg-gray-800 w-full px-4 py-12 rounded-xl flex items-center justify-center">
      <Steps.Root count={4} defaultStep={1} className="w-full max-w-2xl">
        <Steps.List className="flex justify-between items-center">
          {steps.map((step, index) => (
            <Steps.Item key={step} index={index} className="relative flex not-last:flex-1 items-center">
              <Steps.Trigger className="flex items-center gap-3 text-left rounded-md">
                <Steps.Indicator className="flex justify-center items-center shrink-0 rounded-full font-semibold w-8 h-8 text-sm border-2 data-complete:bg-blue-600 data-complete:text-white data-complete:border-blue-600 data-current:bg-blue-600 data-current:text-white data-current:border-blue-600 data-incomplete:bg-gray-100 data-incomplete:text-gray-500 data-incomplete:border-gray-200 dark:data-incomplete:bg-gray-700 dark:data-incomplete:text-gray-300 dark:data-incomplete:border-gray-600">
                  {step}
                </Steps.Indicator>
              </Steps.Trigger>
              <Steps.Separator hidden={index === steps.length - 1} className="flex-1 bg-gray-200 dark:bg-gray-700 h-0.5 mx-3 data-complete:bg-blue-600" />
            </Steps.Item>
          ))}
        </Steps.List>
        {steps.map((step, index) => (
          <Steps.Content key={step} index={index} tabIndex={-1} className="sr-only">{step}</Steps.Content>
        ))}
      </Steps.Root>
    </div>
  );
}

type StepDescription = { title: string; description: string };

const exampleSteps: StepDescription[] = [
  { title: "Step One", description: "Desc for step one" },
  { title: "Step Two", description: "Desc for step two" },
  { title: "Step Three", description: "Desc for step three" },
];

function subscribe(callback: () => void) {
  const query = window.matchMedia("(min-width: 768px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const getDesktopSnapshot = () => window.matchMedia("(min-width: 768px)").matches;
const getServerSnapshot = () => false;

/** The supplied description demo, with optional landing-page styling and copy. */
function InteractiveStepsWithDescriptions({
  steps = exampleSteps,
  landing = false,
}: {
  steps?: StepDescription[];
  landing?: boolean;
}) {
  const desktop = useSyncExternalStore(subscribe, getDesktopSnapshot, getServerSnapshot);
  const vertical = landing && !desktop;

  return (
    <div className={landing ? "w-full" : "bg-white dark:bg-gray-800 w-full px-4 py-12 rounded-xl flex items-center justify-center"}>
      <Steps.Root count={steps.length} defaultStep={landing ? 0 : 1} orientation={vertical ? "vertical" : "horizontal"} className={landing ? "w-full" : "w-full max-w-2xl"}>
        <Steps.List className="inline-flex w-full data-[orientation=vertical]:flex-col">
          {steps.map((step, index) => (
            <Steps.Item key={index} index={index} className={vertical ? "relative flex min-w-0 pb-9 last:pb-0" : "flex min-w-0 items-center relative flex-1 flex-col"}>
              <Steps.Trigger className={`group relative z-10 flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-8 ${vertical ? "items-start gap-5 text-left" : "w-full flex-col items-center gap-4 px-3 text-center"} ${landing ? "focus-visible:outline-lp-coral" : "focus-visible:outline-blue-600"}`}>
                <Steps.Indicator className={`relative flex justify-center items-center shrink-0 rounded-full font-semibold border-2 ${landing ? "size-11 text-base data-complete:bg-lp-coral data-complete:text-lp-bg data-complete:border-lp-coral data-current:bg-lp-coral data-current:text-lp-bg data-current:border-lp-coral data-incomplete:bg-lp-bg-deep data-incomplete:text-lp-pink data-incomplete:border-lp-line" : "w-8 h-8 text-sm data-complete:bg-blue-600 data-complete:text-white data-complete:border-blue-600 data-current:bg-blue-600 data-current:text-white data-current:border-blue-600 data-incomplete:bg-gray-100 data-incomplete:text-gray-500 data-incomplete:border-gray-200 dark:data-incomplete:bg-gray-700 dark:data-incomplete:text-gray-300 dark:data-incomplete:border-gray-600"}`}>
                  <span className="group-data-complete:hidden group-data-current:block">{index + 1}</span>
                  <Check aria-hidden className="w-4 h-4 group-data-complete:block hidden" />
                </Steps.Indicator>
                <div className={`flex min-w-0 flex-col ${vertical ? "items-start pt-1" : "items-center"}`}>
                  <span className={landing ? "font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em] text-lp-chalk" : "text-sm font-semibold text-gray-900 dark:text-gray-100"}>{step.title}</span>
                  <span className={landing ? "mt-3 max-w-[22rem] text-lg leading-[1.5] text-lp-chalk/70" : "text-xs text-gray-500 dark:text-gray-400"}>{step.description}</span>
                </div>
              </Steps.Trigger>
              <Steps.Separator hidden={index === steps.length - 1} className={vertical ? "absolute left-[21px] top-12 bottom-1 w-0.5 bg-lp-line data-complete:bg-lp-coral" : `absolute h-0.5 -translate-y-1/2 ${landing ? "top-[22px] left-[calc(50%+1.75rem)] w-[calc(100%-3.5rem)] bg-lp-line data-complete:bg-lp-coral" : "top-4 left-[calc(50%+1.075rem)] w-[calc(100%-2.15rem)] bg-gray-200 dark:bg-gray-700 data-complete:bg-blue-600"}`} />
            </Steps.Item>
          ))}
        </Steps.List>
        {steps.map((step, index) => (
          <Steps.Content key={index} index={index} tabIndex={-1} className="sr-only">
            {step.title}: {step.description}
          </Steps.Content>
        ))}
      </Steps.Root>
    </div>
  );
}

export function StepsWithDescriptions({
  steps = exampleSteps,
  landing = false,
}: {
  steps?: StepDescription[];
  landing?: boolean;
}) {
  if (!landing) return <InteractiveStepsWithDescriptions steps={steps} />;

  return (
    <ol className="flex w-full flex-col md:flex-row">
      {steps.map((step, index) => (
        <li key={index} className="relative flex min-w-0 gap-5 pb-9 last:pb-0 md:flex-1 md:flex-col md:items-center md:gap-4 md:px-3 md:pb-0 md:text-center">
          <span aria-hidden className={`relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold ${index === 0 ? "border-lp-coral bg-lp-coral text-lp-bg" : "border-lp-line bg-lp-bg-deep text-lp-pink"}`}>
            {index + 1}
          </span>
          <div className="relative z-10 flex min-w-0 flex-col items-start pt-1 md:items-center md:pt-0">
            <h3 className="font-display text-[1.75rem] leading-[1.1] tracking-[-0.02em] text-lp-chalk">{step.title}</h3>
            <p className="mt-3 max-w-[22rem] text-lg leading-[1.5] text-lp-chalk/70">{step.description}</p>
          </div>
          {index < steps.length - 1 && (
            <span aria-hidden className="absolute bottom-1 left-[21px] top-12 w-0.5 bg-lp-line md:bottom-auto md:left-[calc(50%+1.75rem)] md:top-[22px] md:h-0.5 md:w-[calc(100%-3.5rem)] md:-translate-y-1/2" />
          )}
        </li>
      ))}
    </ol>
  );
}
