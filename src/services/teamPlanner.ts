import "server-only";
import type { CoachContext } from "@/core/aiPlan";
import type { AgentId } from "@/core/coach/agents";
import {
  buildOutlineMessage,
  buildSpecialistMessage,
  checkOutline,
  outlineSchema,
  sessionsFromTeam,
  specialistAnswerSchema,
  sportsInOutline,
  type SpecialistAnswer,
} from "@/core/coach/teamPlan";
import { checkPlan, type PlannableSport, type PlannedSession, type PlannerInput, type PlanningContext } from "@/core/planner";
import { askCoachStructured } from "./coachRuntime";
import type { AppSupabaseClient } from "./types";

export type TeamPlan = {
  sessions: (PlannedSession & { reason: string })[];
  /** What each coach said, for the coach conversation: head coach first. */
  messages: { agent: AgentId; content: string }[];
};

/**
 * The coach team plans the week: the head coach makes the outline, then the
 * specialists choose their workouts at the same time. Returns null when the head
 * coach isn't available (no key, error, budget used up) or the result breaks the
 * rules; the caller then uses the rule-based planner.
 */
export async function planWeekAsTeam(args: {
  supabase: AppSupabaseClient;
  userId: string;
  budgetSince: string;
  input: PlannerInput;
  context: PlanningContext;
  coach: CoachContext;
}): Promise<TeamPlan | null> {
  const { supabase, userId, budgetSince, input, context, coach } = args;
  const call = (agent: AgentId, content: string) => ({
    supabase,
    userId,
    agent,
    purpose: "plan_week" as const,
    budgetSince,
    messages: [{ role: "user" as const, content }],
  });

  // Round 1: the outline.
  const outline = await askCoachStructured(call("head", buildOutlineMessage(input, context, coach)), outlineSchema);
  if (outline.status !== "ok") return null;
  const assignments = checkOutline(context, outline.output);

  // Round 2: each specialist chooses for its own days, all at the same time.
  const sports = sportsInOutline(assignments);
  const results = await Promise.all(
    sports.map((sport) =>
      askCoachStructured(
        call(sport, buildSpecialistMessage(sport, assignments.filter((item) => item.sport === sport), input, context, coach)),
        specialistAnswerSchema,
      ),
    ),
  );
  const answers: Partial<Record<PlannableSport, SpecialistAnswer | null>> = {};
  sports.forEach((sport, index) => {
    const result = results[index];
    answers[sport] = result.status === "ok" ? result.output : null;
  });

  const sessions = sessionsFromTeam(input, context, assignments, answers);
  const problems = checkPlan(context, sessions);
  if (problems.length > 0) {
    console.warn("Team week plan rejected:", problems);
    return null;
  }

  const messages: TeamPlan["messages"] = [{ agent: "head", content: outline.output.summary.trim() }];
  for (const sport of sports) {
    const summary = answers[sport]?.summary.trim();
    if (summary) messages.push({ agent: sport, content: summary });
  }
  return { sessions, messages: messages.filter((message) => message.content.length > 0) };
}
