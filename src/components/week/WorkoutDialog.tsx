"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createContext, useContext, useId, useRef, type PointerEvent, type ReactNode } from "react";
import { haptic, projectedDistance, rubberband, spring } from "@/components/spring";

// A training opens as a pop-up: the card grows into a window in the middle of the
// screen while the background blurs. The growing is a View Transition: the browser
// morphs the small card into the window. Browsers without View Transitions (and
// people who prefer less motion) get a simple fade and zoom from CSS instead.
//
// Like an iOS sheet you can also swipe it down by its top bar: it follows your
// finger 1:1, and on release a quick flick or a long pull closes it; otherwise it
// springs back, carrying on at your finger's speed.

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
  /** What to tap on the page, when it isn't the summary (e.g. a big "Start workout" card). */
  trigger?: ReactNode;
  /** Classes for that tap area, replacing the default small-card look. */
  triggerClassName?: string;
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

export function WorkoutDialog({ summary, title, children, trigger, triggerClassName }: WorkoutDialogProps) {
  const t = useTranslations("Workout");
  const cardRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  // A unique name links the card and the window, so the browser morphs one into the other.
  const morphName = `workout-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  /** The swipe in progress: where it started and the last positions, for the speed. */
  const drag = useRef<{ pointerId: number; startY: number; active: boolean; samples: { y: number; t: number }[] } | null>(null);
  /** Stops a running spring when you grab the window again mid-way. */
  const stopSpring = useRef<(() => void) | null>(null);
  const offset = useRef(0);

  function setOffset(y: number) {
    offset.current = y;
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.style.translate = y === 0 ? "" : `0 ${y}px`;
    // The background clears up as you pull (used by ::backdrop in globals.css).
    dialog.style.setProperty("--sheet-pull", String(Math.min(1, Math.max(0, y) / dialog.offsetHeight)));
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    stopSpring.current?.();
    drag.current = { pointerId: event.pointerId, startY: event.clientY - offset.current, active: false, samples: [] };
  }

  function onPointerMove(event: PointerEvent) {
    const current = drag.current;
    const dialog = dialogRef.current;
    if (!current || !dialog || current.pointerId !== event.pointerId) return;
    const pulled = event.clientY - current.startY;
    // About 10 px before it counts as a swipe, so a tap on the close button stays a tap.
    if (!current.active) {
      if (Math.abs(pulled) < 10) return;
      current.active = true;
      // The background follows the finger directly, without its usual fade.
      dialog.dataset.dragging = "";
      current.startY += Math.sign(pulled) * 10;
      // Keeps following the finger when it leaves the bar.
      if (event.currentTarget.hasPointerCapture?.(event.pointerId) === false) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // The pointer is already gone; the swipe still works while it stays on the bar.
        }
      }
    }
    const y = event.clientY - current.startY;
    // Down follows the finger; up resists more and more, there's nothing up there.
    setOffset(y >= 0 ? y : rubberband(y, dialog.offsetHeight));
    current.samples = [...current.samples, { y: event.clientY, t: event.timeStamp }].filter(
      (sample) => event.timeStamp - sample.t < 100,
    );
  }

  function onPointerUp(event: PointerEvent) {
    const current = drag.current;
    const dialog = dialogRef.current;
    drag.current = null;
    if (!current?.active || !dialog) return;
    const first = current.samples[0];
    const last = current.samples.at(-1);
    const velocity = first && last && last.t > first.t ? ((last.y - first.y) / (last.t - first.t)) * 1000 : 0;
    // Where the flick is heading decides, not only where you let go.
    const restingAt = offset.current + projectedDistance(velocity);
    const settle = () => delete dialog.dataset.dragging;
    // A real pull (not a twitch) heading past a third of the window closes it.
    if (offset.current > 30 && restingAt > dialog.offsetHeight * 0.35 && velocity > -100) {
      settle();
      haptic();
      close();
      return;
    }
    const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersLessMotion) {
      setOffset(0);
      settle();
      return;
    }
    stopSpring.current = spring({
      from: offset.current,
      to: 0,
      velocity,
      response: 0.35,
      damping: 1,
      onUpdate: setOffset,
      onDone: settle,
    });
  }

  function setName(element: HTMLElement | null, on: boolean) {
    if (element) element.style.viewTransitionName = on ? morphName : "";
  }

  function open() {
    const card = cardRef.current;
    const dialog = dialogRef.current;
    if (!card || !dialog || dialog.open) return;
    stopSpring.current?.();
    setOffset(0);
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
      () => {
        setName(card, false);
        setOffset(0);
      },
    );
  }

  return (
    <>
      <button
        ref={cardRef}
        type="button"
        aria-haspopup="dialog"
        onClick={open}
        className={
          triggerClassName ??
          "w-full rounded-2xl border border-white/[0.06] bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-accent active:scale-[0.98]"
        }
      >
        {trigger ?? summary}
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
            {/* The top bar is the grip: swipe it down to close. touch-none: the browser leaves the swipe to us. */}
            <div
              className="-mx-4 -mt-4 flex touch-none flex-col gap-3 px-4 pt-2"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <span aria-hidden className="mx-auto h-1.5 w-10 rounded-full bg-white/20" />
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
            </div>
            {children}
          </div>
        </DialogContext>
      </dialog>
    </>
  );
}
