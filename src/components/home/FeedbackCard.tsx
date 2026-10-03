import { MessageCircleHeart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { StoredMessage } from "@/components/coach/StoredMessage";
import { TrainingFeedbackForm } from "@/components/coach/TrainingFeedbackForm";
import { getWorkout } from "@/core/workouts/library";
import type { CoachMessage } from "@/services/coachMessages";
import type { PlannedWorkout } from "@/services/workouts";
import { useWhenLabel } from "./useWhenLabel";

type FeedbackCardProps = {
  /** The training to ask "How did it go?" about, or null. */
  target: PlannedWorkout | null;
  /** The coach's latest reaction to one of your recent trainings, or null. */
  reaction: CoachMessage | null;
  today: string;
};

/** On Home: the coach's latest reaction, and "How did your training go?" for the latest training. */
export function FeedbackCard({ target, reaction, today }: FeedbackCardProps) {
  const t = useTranslations("Coach");
  const locale = useLocale();
  const whenLabel = useWhenLabel(today);
  if (!target && !reaction) return null;

  const name = target ? ((target.template_id && getWorkout(target.template_id)?.name[locale === "nl" ? "nl" : "en"]) || target.title) : "";

  return (
    <section className="flex flex-col gap-4 rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-blue/20 via-surface/70 to-surface/70 p-5 backdrop-blur-xl">
      {reaction && <StoredMessage message={reaction} />}

      {target && (
        <>
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue">
              <MessageCircleHeart className="size-5" />
            </span>
            <div className="flex min-w-0 flex-col">
              <p className="eyebrow">{whenLabel(target.scheduled_on)}</p>
              <h2 className="truncate text-lg font-bold">{t("howDidItGo", { name })}</h2>
            </div>
          </div>
          <TrainingFeedbackForm workoutId={target.id} />
        </>
      )}
    </section>
  );
}
