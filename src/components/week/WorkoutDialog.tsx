"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useContext, useId, useRef, type ReactNode } from "react";

// A training opens as a pop-up: the card grows into a window in the middle of the
// screen while the background blurs. The growing is a View Transition: the browser
// morphs the small card into the window. Browsers without View Transitions (and
// people who prefer less motion) get a simple fade and zoom from CSS instead.

type DialogControls = { open: () => void; close: () => void };
const DialogContext = createContext<DialogControls>({ open: () => {}, close: () => {} });

/** Lets content inside the window close (or reopen) it, e.g. when deleting the training. */
export function useWorkoutDialog() {
  return useContext(DialogContext);
}

type WorkoutDialogProps = {
  /** The small card: sport, name and length. Shown on the page and at the top of the window. */
  summary: ReactNode;
  /** The name, for screen readers. */
  title: string;
  /** Everything in the window under the summary. */
  children: ReactNode;
};

function withViewTransition(update: () => void, cleanup: () => void) {
  const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || prefersLessMotion) {
    update();
    cleanup();
    return;
  }
  // While morphing, the CSS fade is switched off so the two animations don't stack.
  document.documentElement.dataset.morphing = "";
  const transition = document.startViewTransition(update);
  // The browser may skip the animation (e.g. when the tab is hidden); the update still happens.
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    delete document.documentElement.dataset.morphing;
    cleanup();
  });
}

export function WorkoutDialog({ summary, title, children }: WorkoutDialogProps) {
  const t = useTranslations("Workout");
  const cardRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // A unique name links the card and the window, so the browser morphs one into the other.
  const morphName = `workout-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  function setName(element: HTMLElement | null, on: boolean) {
    if (element) element.style.viewTransitionName = on ? morphName : "";
  }

  function open() {
    const card = cardRef.current;
    const dialog = dialogRef.current;
    if (!card || !dialog || dialog.open) return;
    // Before: the card has the name. After: the window has it.
    setName(card, true);
    withViewTransition(
      () => {
        setName(card, false);
        setName(dialog, true);
        dialog.showModal();
      },
      () => setName(dialog, false),
    );
  }

  function close() {
    const card = cardRef.current;
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    setName(dialog, true);
    withViewTransition(
      () => {
        setName(dialog, false);
        dialog.close();
        setName(card, true);
      },
      () => setName(card, false),
    );
  }

  return (
    <>
      <button
        ref={cardRef}
        type="button"
        aria-haspopup="dialog"
        onClick={open}
        className="w-full rounded-2xl bg-surface-raised p-3 text-left transition hover:bg-line focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.99]"
      >
        {summary}
      </button>

      <dialog
        ref={dialogRef}
        aria-label={title}
        className="workout-dialog"
        // Escape: close with the same animation instead of the browser's instant close.
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        // A click on the blurred background (the dialog itself, not its content) closes it.
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
      >
        <DialogContext value={{ open, close }}>
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">{summary}</div>
              <button
                type="button"
                onClick={close}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-muted hover:text-foreground"
              >
                <X aria-hidden className="size-5" />
                <span className="sr-only">{t("close")}</span>
              </button>
            </div>
            {children}
          </div>
        </DialogContext>
      </dialog>
    </>
  );
}
