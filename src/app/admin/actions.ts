"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createAgentKey,
  markAllAgentMessagesRead,
  postAgentMessage,
  revokeAgentKey,
  setAgentMessageStatus,
  setAiBudget,
} from "@/services/admin";

// Actions of the agent hub on /admin. The database functions refuse everyone who
// is not in public.admins, so these only validate the input and refresh the page.

export type AdminActionResult = { ok: true } | { ok: false; error: string };

const agentName = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,32}$/);

async function run(work: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<unknown>): Promise<AdminActionResult> {
  try {
    await work(await createClient());
  } catch (error) {
    console.error("admin action failed", error);
    return { ok: false, error: "Opslaan mislukt." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function setMessageStatusAction(id: number, status: "read" | "approved" | "rejected" | "done" | "new") {
  const parsed = z
    .object({ id: z.number().int().positive(), status: z.enum(["new", "read", "approved", "rejected", "done"]) })
    .safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Ongeldig." } satisfies AdminActionResult;
  return run((supabase) => setAgentMessageStatus(supabase, parsed.data.id, parsed.data.status));
}

export async function markAllReadAction() {
  return run((supabase) => markAllAgentMessagesRead(supabase));
}

export async function replyToAgentAction(toAgent: string, body: string, threadId: number | null) {
  const parsed = z
    .object({ toAgent: agentName, body: z.string().trim().min(1).max(8000), threadId: z.number().int().positive().nullable() })
    .safeParse({ toAgent, body, threadId });
  if (!parsed.success) return { ok: false, error: "Leeg of te lang bericht." } satisfies AdminActionResult;
  return run((supabase) => postAgentMessage(supabase, parsed.data.toAgent, parsed.data.body, parsed.data.threadId));
}

/** Returns the new key once, so the page can show it; it is never shown again. */
export async function createAgentKeyAction(name: string): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const parsed = agentName.refine((n) => n !== "jeremy" && n !== "runvex").safeParse(name);
  if (!parsed.success) return { ok: false, error: "Naam: 2-32 tekens, alleen a-z, 0-9 en -." };
  try {
    const key = await createAgentKey(await createClient(), parsed.data);
    revalidatePath("/admin");
    return { ok: true, key };
  } catch (error) {
    console.error("create agent key failed", error);
    return { ok: false, error: "Sleutel maken mislukt." };
  }
}

export async function revokeAgentKeyAction(name: string) {
  const parsed = agentName.safeParse(name);
  if (!parsed.success) return { ok: false, error: "Ongeldig." } satisfies AdminActionResult;
  return run((supabase) => revokeAgentKey(supabase, parsed.data));
}

export async function setAiBudgetAction(monthlyBudgetUsd: number, creditTopupUsd: number | null) {
  const parsed = z
    .object({ monthly: z.number().min(0).max(10_000), topup: z.number().positive().max(10_000).nullable() })
    .safeParse({ monthly: monthlyBudgetUsd, topup: creditTopupUsd });
  if (!parsed.success) return { ok: false, error: "Ongeldig bedrag." } satisfies AdminActionResult;
  return run((supabase) => setAiBudget(supabase, parsed.data.monthly, parsed.data.topup));
}
