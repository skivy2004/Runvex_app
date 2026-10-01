import type { SupabaseClient } from "@supabase/supabase-js";
import type { Sport, ExperienceLevel, WorkPattern } from "@/core/training";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Services receive the Supabase client as a parameter instead of creating one.
 * That keeps them independent of Next.js, so a mobile app can reuse them.
 */
export type AppSupabaseClient = SupabaseClient<Database>;

// Compile-time check that the lists in core/training.ts match the database
// enums. If someone changes one without the other, TypeScript errors here.
type Enums = Database["public"]["Enums"];
type SameValues<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const enumsInSync: [
  SameValues<Sport, Enums["sport"]>,
  SameValues<ExperienceLevel, Enums["experience_level"]>,
  SameValues<WorkPattern, Enums["work_pattern"]>,
] = [true, true, true];
