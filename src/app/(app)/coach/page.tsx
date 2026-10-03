import { getTranslations } from "next-intl/server";
import { CoachBubble } from "@/components/coach/CoachBubble";
import { CoachComposer } from "@/components/coach/CoachComposer";
import { StoredMessage } from "@/components/coach/StoredMessage";
import { PageHeading } from "@/components/PageHeading";
import { budgetWeekStart, WEEKLY_AI_BUDGET_USD } from "@/core/coach/budget";
import { todayInTimeZone } from "@/core/dates";
import { getRequestClient, getRequestProfile } from "@/lib/currentUser";
import { aiSpentSince } from "@/services/aiUsage";
import { getCoachMessages } from "@/services/coachMessages";

/** How many messages the page shows. */
const SHOWN = 60;

/** Written in the last minute, i.e. just now: those come up in the chat. */
function isJustWritten(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 60_000;
}

/** The coach team: the conversation with the head coach (and what the others said). */
export default async function CoachPage() {
  const t = await getTranslations("Coach");
  const supabase = await getRequestClient();
  const profile = await getRequestProfile();
  if (!profile) return null;

  const today = todayInTimeZone(profile.timezone);
  const [messages, spent] = await Promise.all([
    getCoachMessages(supabase, profile.id, SHOWN),
    aiSpentSince(supabase, profile.id, budgetWeekStart(today, profile.timezone)),
  ]);
  const left = Math.max(0, Math.round((1 - spent / WEEKLY_AI_BUDGET_USD) * 100));

  return (
    <div className="flex flex-1 flex-col gap-5">
      <PageHeading eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      {/* How much of this week's coach time is left. */}
      <div className="flex flex-col gap-1.5">
        <p className="flex justify-between text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted">
          <span>{t("budget")}</span>
          <span>{t("budgetLeft", { percent: left })}</span>
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="bar-grow h-full rounded-full bg-gradient-to-r from-blue to-coral" style={{ width: `${left}%` }} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {messages.length === 0 && <CoachBubble agent="head">{t("welcome")}</CoachBubble>}
        {messages.map((message) => (
          <StoredMessage key={message.id} message={message} isNew={isJustWritten(message.created_at)} />
        ))}
        <CoachComposer suggestions={[t("suggestion.lessTime"), t("suggestion.tired"), t("suggestion.why")]} />
      </div>
    </div>
  );
}
