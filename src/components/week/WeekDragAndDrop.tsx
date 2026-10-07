"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Translate,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { createContext, useContext, useId, useState, useTransition, type ReactNode } from "react";
import { moveWorkoutAction } from "@/app/(app)/week/actions";
import { haptic } from "@/components/spring";
import { toFormattableDate } from "@/core/dates";

// Dragging trainings to another day in the week view. Days are drop zones (their id
// is the date), trainings are draggable by their grip handle, so tapping the card
// still opens it and the page still scrolls normally.

const nameOf = (data: Record<string, unknown> | undefined) => String(data?.name ?? "");

/**
 * Keyboard dragging: arrow down / up jumps to the next / previous day, instead of
 * moving a few pixels per key press.
 */
const jumpToDay: KeyboardCoordinateGetter = (event, { context }) => {
  const { collisionRect, droppableRects, droppableContainers } = context;
  if (!collisionRect || (event.code !== "ArrowDown" && event.code !== "ArrowUp")) return undefined;
  event.preventDefault();
  const days = droppableContainers
    .getEnabled()
    .flatMap((container) => droppableRects.get(container.id) ?? [])
    .sort((a, b) => a.top - b.top);
  const target =
    event.code === "ArrowDown"
      ? days.find((rect) => rect.top > collisionRect.top + 1)
      : days.findLast((rect) => rect.top < collisionRect.top - 1);
  return target ? { x: collisionRect.left, y: target.top + 16 } : undefined;
};

/**
 * The training being saved after a drop, and where it was dropped: it stays there
 * (dimmed) until the new week arrives, instead of flying back to its old day first.
 */
type Moving = { id: string; delta: Translate };
const MovingContext = createContext<Moving | null>(null);

export function WeekDragAndDrop({ children }: { children: ReactNode }) {
  const t = useTranslations("WorkoutActions");
  const format = useFormatter();
  // A fixed id, so the server and the browser give the drag handles the same aria ids.
  const dndId = useId();
  const [moving, setMoving] = useState<Moving | null>(null);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    // A mouse drag starts after moving 8 px, so a click is still a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // On a phone: press and hold the handle briefly, so scrolling isn't mistaken for dragging.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    // Keyboard: focus the handle, Space to pick up, arrows to move, Space to drop.
    useSensor(KeyboardSensor, { coordinateGetter: jumpToDay }),
  );

  const dayName = (date: string) =>
    format.dateTime(toFormattableDate(date), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  function handleDragEnd(event: DragEndEvent) {
    const id = String(event.active.id);
    const from = event.active.data.current?.date as string | undefined;
    const to = event.over ? String(event.over.id) : null;
    if (!to || to === from) return;

    haptic(12);
    setFailed(false);
    setMoving({ id, delta: event.delta });
    startTransition(async () => {
      const result = await moveWorkoutAction(id, to);
      setMoving(null);
      if (!result.ok) setFailed(true);
    });
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      // A short tick when you pick a training up (on phones that support it).
      onDragStart={() => haptic(8)}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: { draggable: t("dragInstructions") },
        // What screen readers say while dragging, in the app language.
        announcements: {
          onDragStart: ({ active }) => t("pickedUp", { name: nameOf(active.data.current) }),
          onDragOver: ({ active, over }) =>
            over ? t("over", { name: nameOf(active.data.current), day: dayName(String(over.id)) }) : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? t("dropped", { name: nameOf(active.data.current), day: dayName(String(over.id)) })
              : t("cancelled", { name: nameOf(active.data.current) }),
          onDragCancel: ({ active }) => t("cancelled", { name: nameOf(active.data.current) }),
        },
      }}
    >
      <MovingContext value={moving}>{children}</MovingContext>
      {failed && (
        <p role="alert" className="text-center text-sm text-danger">
          {t("failed")}
        </p>
      )}
    </DndContext>
  );
}

export function DroppableDay({ date, children }: { date: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-[1.75rem] transition ${isOver ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
    >
      {children}
    </div>
  );
}

type DraggableWorkoutProps = {
  id: string;
  date: string;
  /** Used in the handle's label, e.g. "Move Long run". */
  name: string;
  children: ReactNode;
};

export function DraggableWorkout({ id, date, name, children }: DraggableWorkoutProps) {
  const t = useTranslations("WorkoutActions");
  const moving = useContext(MovingContext);
  const isSaving = moving?.id === id;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { date, name },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform ?? (isSaving ? { ...moving.delta, scaleX: 1, scaleY: 1 } : null)),
        // While dragging it sticks to your finger (no transition). Let go outside a day
        // and it glides back to its place from wherever it is.
        transition: isDragging || isSaving ? "scale 200ms var(--ease-out)" : "transform 300ms var(--ease-out), scale 200ms var(--ease-out)",
      }}
      className={`relative flex items-stretch gap-1 ${
        // Lifted: a little bigger with a deep shadow, like picking up a card.
        isDragging ? "z-20 scale-[1.03] rounded-2xl shadow-2xl shadow-black/60" : ""
      } ${isSaving ? "z-20 opacity-50" : ""}`}
    >
      <button
        type="button"
        aria-label={t("dragHandle", { name })}
        className="flex w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-muted hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
