import { z } from "zod";
import type { Segment } from "@/core/racePresets";
import { sports } from "@/core/training";
import type { AppSupabaseClient } from "./types";

// The database stores segments as JSON, so we check their shape when reading.
const storedSegmentsSchema = z.array(
  z.object({ sport: z.enum(sports), distance_m: z.number().positive() }),
);

function toSegments(json: unknown): Segment[] {
  const parsed = storedSegmentsSchema.safeParse(json);
  if (!parsed.success) return [];
  return parsed.data.map((item) => ({ sport: item.sport, distanceMeters: item.distance_m }));
}

/**
 * The goal to show: the first upcoming event, or else the newest goal without a date.
 * Goals whose event date has passed are skipped.
 */
export async function getCurrentGoal(supabase: AppSupabaseClient, userId: string, today: string) {
  const { data, error } = await supabase
    .from("goals")
    .select("id, description, sports, event_name, event_date, race_preset, segments, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const upcoming = data
    .filter((goal) => goal.event_date !== null && goal.event_date >= today)
    .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1));
  const goal = upcoming[0] ?? data.find((item) => item.event_date === null);
  if (!goal) return null;

  return { ...goal, segments: toSegments(goal.segments) };
}

export type CurrentGoal = NonNullable<Awaited<ReturnType<typeof getCurrentGoal>>>;
