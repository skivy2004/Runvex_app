import type { Json } from "@/lib/supabase/database.types";
import type { AgentId } from "@/core/coach/agents";
import type { AppSupabaseClient } from "./types";

const MESSAGE_COLUMNS = "id, role, agent, content, workout_id, proposal, proposal_status, created_at";

export type NewCoachMessage = {
  role: "user" | "coach";
  agent: AgentId | null;
  content: string;
  workoutId?: string | null;
  /** A proposed change to trainings; saved as "pending" until the user decides. */
  proposal?: Json | null;
};

/** Saves messages in this order and returns them. */
export async function addCoachMessages(supabase: AppSupabaseClient, userId: string, messages: NewCoachMessage[]) {
  const { data, error } = await supabase
    .from("coach_messages")
    .insert(
      messages.map((message) => ({
        user_id: userId,
        role: message.role,
        agent: message.agent,
        content: message.content.slice(0, 4000),
        workout_id: message.workoutId ?? null,
        proposal: message.proposal ?? null,
        proposal_status: message.proposal ? "pending" : null,
      })),
    )
    .select(MESSAGE_COLUMNS);
  if (error) throw error;
  return data;
}

/** The latest messages, oldest first. */
export async function getCoachMessages(supabase: AppSupabaseClient, userId: string, limit: number) {
  const { data, error } = await supabase
    .from("coach_messages")
    .select(MESSAGE_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.reverse();
}

export type CoachMessage = Awaited<ReturnType<typeof getCoachMessages>>[number];

/** The coach's messages about these trainings (e.g. reactions to how they went), newest first. */
export async function getMessagesAboutWorkouts(supabase: AppSupabaseClient, userId: string, workoutIds: string[]) {
  if (workoutIds.length === 0) return [];
  const { data, error } = await supabase
    .from("coach_messages")
    .select(MESSAGE_COLUMNS)
    .eq("user_id", userId)
    .eq("role", "coach")
    .in("workout_id", workoutIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCoachMessage(supabase: AppSupabaseClient, userId: string, id: string) {
  const { data, error } = await supabase
    .from("coach_messages")
    .select(MESSAGE_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function setProposalStatus(
  supabase: AppSupabaseClient,
  userId: string,
  id: string,
  status: "applied" | "dismissed",
) {
  return supabase
    .from("coach_messages")
    .update({ proposal_status: status })
    .eq("user_id", userId)
    .eq("id", id)
    .eq("proposal_status", "pending");
}
