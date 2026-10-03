"use server";

import { after } from "next/server";
import { z } from "zod";
import type { AgentId } from "@/core/coach/agents";
import {
  buildChatFinalMessage,
  buildChatMessage,
  buildConsultMessage,
  buildFeedbackMessage,
  chatAnswerSchema,
  chatFinalSchema,
  feedbackAnswerSchema,
  feelings,
  isAgentId,
  type TranscriptLine,
} from "@/core/coach/conversation";
import { checkChanges, proposalChangeSchema, type ProposalChange } from "@/core/coach/proposal";
import { canCheckOff } from "@/core/validation/feedback";
import { estimatedMinutes } from "@/core/workouts/estimate";
import { getWorkout } from "@/core/workouts/library";
import { getRequestProfile } from "@/lib/currentUser";
import { refreshAppData } from "@/lib/refreshAppData";
import { createClient } from "@/lib/supabase/server";
import { addCoachMessages, getCoachMessage, getCoachMessages, setProposalStatus } from "@/services/coachMessages";
import { askCoachStructured, askCoachText } from "@/services/coachRuntime";
import { changeLabel, loadCoachSetting, trainingName, type CoachSetting } from "@/services/coachSituation";
import { removeFromWatch, sendToWatch } from "@/services/watchSync";
import {
  changePlannedTemplate,
  deletePlannedWorkout,
  getPlannedWorkout,
  movePlannedWorkout,
  setWorkoutFeedback,
} from "@/services/workouts";

// The coach team in the app: reactions to how a training went, the chat with the
// head coach, and applying or dismissing what a coach proposes.

/** "budget": this week's AI budget is used up; "unavailable": the coach couldn't answer. */
export type CoachActionResult = { ok: true } | { ok: false; error: "invalid" | "budget" | "unavailable" | "saveFailed" };

const MAX_MESSAGE_LENGTH = 1000;
/** How many earlier messages the head coach reads back. */
const HISTORY = 12;

async function loadUser() {
  const supabase = await createClient();
  const profile = await getRequestProfile();
  return { supabase, profile };
}

/** A proposal as stored with a message: the checked changes, each with a label for the app. */
function proposalOf(changes: ProposalChange[], setting: CoachSetting) {
  return changes.length === 0 ? null : { changes: changes.map((change) => ({ ...change, label: changeLabel(change, setting) })) };
}

// ---------------------------------------------------------------------------
// "How did your training go?"
// ---------------------------------------------------------------------------

const feedbackInputSchema = z.object({
  workoutId: z.uuid(),
  feeling: z.enum(feelings),
  rpe: z.number().int().min(1).max(10).nullable(),
  note: z.string().trim().max(500),
});

/** Checks the training off as done and asks its coach for a reaction (maybe with a proposal). */
export async function submitTrainingFeedbackAction(input: z.input<typeof feedbackInputSchema>): Promise<CoachActionResult> {
  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { workoutId, feeling, rpe, note } = parsed.data;

  const { supabase, profile } = await loadUser();
  if (!profile) return { ok: false, error: "saveFailed" };
  const setting = await loadCoachSetting(supabase, profile);
  const workout = await getPlannedWorkout(supabase, profile.id, workoutId);
  if (!workout || !canCheckOff(workout.scheduled_on, setting.today)) return { ok: false, error: "invalid" };

  // 1. The training is done, with how hard it felt.
  const { error } = await setWorkoutFeedback(supabase, profile.id, workout.id, { status: "done", rpe, note: note || null });
  if (error) return { ok: false, error: "saveFailed" };
  refreshAppData();

  // 2. Its coach reacts. Strength has no specialist: the head coach answers.
  const agent: AgentId = workout.sport === "strength" ? "head" : workout.sport;
  const template = workout.template_id ? getWorkout(workout.template_id) : undefined;
  const answer = await askCoachStructured(
    {
      supabase,
      userId: profile.id,
      agent,
      purpose: "feedback",
      budgetSince: setting.budgetSince,
      effort: "low",
      messages: [
        {
          role: "user",
          content: buildFeedbackMessage(
            setting.situation,
            {
              date: workout.scheduled_on,
              sport: workout.sport,
              name: trainingName(workout, setting.locale),
              description: template?.description[setting.locale] ?? "",
              difficulty: template?.difficulty ?? null,
              category: template?.category ?? null,
              coachNote: workout.notes,
            },
            { feeling, effort: rpe, note: note || null },
          ),
        },
      ],
    },
    feedbackAnswerSchema,
  );
  if (answer.status !== "ok") return { ok: false, error: answer.status };

  const changes = checkChanges(answer.output.changes, setting.situation.upcoming, setting.today);
  await addCoachMessages(supabase, profile.id, [
    { role: "coach", agent, content: answer.output.reaction.trim(), workoutId: workout.id, proposal: proposalOf(changes, setting) },
  ]);
  refreshAppData();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Chat with the head coach
// ---------------------------------------------------------------------------

/** Sends a message to the head coach, who may first ask the specialists, then replies. */
export async function sendCoachMessageAction(text: string): Promise<CoachActionResult> {
  const message = text.trim();
  if (message.length === 0 || message.length > MAX_MESSAGE_LENGTH) return { ok: false, error: "invalid" };

  const { supabase, profile } = await loadUser();
  if (!profile) return { ok: false, error: "saveFailed" };
  const [setting, earlier] = await Promise.all([
    loadCoachSetting(supabase, profile),
    getCoachMessages(supabase, profile.id, HISTORY),
  ]);
  await addCoachMessages(supabase, profile.id, [{ role: "user", agent: null, content: message }]);
  refreshAppData();

  const history: TranscriptLine[] = earlier.map((item) => ({
    from: item.role === "user" ? "athlete" : isAgentId(item.agent) ? item.agent : "head",
    text: item.content,
  }));
  const call = (agent: AgentId, content: string) => ({
    supabase,
    userId: profile.id,
    agent,
    purpose: "chat" as const,
    budgetSince: setting.budgetSince,
    messages: [{ role: "user" as const, content }],
  });

  // 1. The head coach answers, or first asks the specialists.
  const first = await askCoachStructured(call("head", buildChatMessage(setting.situation, history, message)), chatAnswerSchema);
  if (first.status !== "ok") return { ok: false, error: first.status };
  let reply = first.output.reply;
  let changes = first.output.changes;
  const specialistMessages: { role: "coach"; agent: AgentId; content: string }[] = [];

  const consult = first.output.consult.slice(0, 3);
  if (consult.length > 0) {
    // 2. The specialists answer at the same time, then the head coach writes the reply.
    const answers = await Promise.all(
      consult.map((item) => askCoachText(call(item.sport, buildConsultMessage(setting.situation, item.question, message)))),
    );
    const advice = consult.flatMap((item, index) => {
      const result = answers[index];
      return result.status === "ok" ? [{ sport: item.sport as AgentId, answer: result.output }] : [];
    });
    advice.forEach((item) => specialistMessages.push({ role: "coach", agent: item.sport, content: item.answer }));
    const final = await askCoachStructured(
      call("head", buildChatFinalMessage(setting.situation, history, message, advice)),
      chatFinalSchema,
    );
    if (final.status !== "ok") return { ok: false, error: final.status };
    reply = final.output.reply;
    changes = final.output.changes;
  }
  if (!reply.trim()) return { ok: false, error: "unavailable" };

  const checked = checkChanges(changes, setting.situation.upcoming, setting.today);
  await addCoachMessages(supabase, profile.id, [
    ...specialistMessages,
    { role: "coach", agent: "head", content: reply.trim(), proposal: proposalOf(checked, setting) },
  ]);
  refreshAppData();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------

const storedProposalSchema = z.object({ changes: z.array(proposalChangeSchema) });

/** Applies a coach's proposal: every change that still fits (the training is still planned). */
export async function applyProposalAction(messageId: string): Promise<CoachActionResult> {
  if (!z.uuid().safeParse(messageId).success) return { ok: false, error: "invalid" };
  const { supabase, profile } = await loadUser();
  if (!profile) return { ok: false, error: "saveFailed" };

  const message = await getCoachMessage(supabase, profile.id, messageId);
  const proposal = storedProposalSchema.safeParse(message?.proposal);
  if (!message || message.proposal_status !== "pending" || !proposal.success) return { ok: false, error: "invalid" };

  const setting = await loadCoachSetting(supabase, profile);
  const changed: string[] = [];
  const removed: string[] = [];
  for (const change of proposal.data.changes) {
    const workout = await getPlannedWorkout(supabase, profile.id, change.workoutId);
    if (!workout || workout.status !== "planned") continue;
    if (change.type === "remove") {
      const { error } = await deletePlannedWorkout(supabase, profile.id, workout.id);
      if (!error) removed.push(workout.id);
    } else if (change.type === "move" && change.newDate) {
      const { error } = await movePlannedWorkout(supabase, profile.id, workout.id, change.newDate);
      if (!error) changed.push(workout.id);
    } else if (change.type === "swap" && change.newWorkoutId) {
      const template = getWorkout(change.newWorkoutId);
      const level = setting.levels.get(workout.sport);
      const minutes = template && level ? estimatedMinutes(template, level) : null;
      if (!template || template.sport !== workout.sport || minutes === null) continue;
      const { error } = await changePlannedTemplate(supabase, profile.id, workout.id, {
        templateId: template.id,
        title: template.name[setting.locale],
        durationMinutes: minutes,
        notes: change.reason,
      });
      if (!error) changed.push(workout.id);
    }
  }
  await setProposalStatus(supabase, profile.id, message.id, "applied");

  // The watch follows the plan, after the response.
  after(async () => {
    if (removed.length > 0) await removeFromWatch(removed);
    const updated = await Promise.all(changed.map((id) => getPlannedWorkout(supabase, profile.id, id)));
    await sendToWatch(updated.flatMap((workout) => (workout ? [workout] : [])), setting.locale);
  });
  refreshAppData();
  return { ok: true };
}

export async function dismissProposalAction(messageId: string): Promise<CoachActionResult> {
  if (!z.uuid().safeParse(messageId).success) return { ok: false, error: "invalid" };
  const { supabase, profile } = await loadUser();
  if (!profile) return { ok: false, error: "saveFailed" };
  const { error } = await setProposalStatus(supabase, profile.id, messageId, "dismissed");
  if (error) return { ok: false, error: "saveFailed" };
  refreshAppData();
  return { ok: true };
}
