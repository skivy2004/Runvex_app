import { z } from "zod";
import { equipmentTypes, poolLengths, type Equipment, type PoolLength } from "@/core/workouts/swim";

/** Your swim settings: the pool you swim in and the equipment you own. */
export const swimSettingsSchema = z.object({
  poolLength: z.union([z.literal(poolLengths[0]), z.literal(poolLengths[1])]),
  // Each item at most once.
  equipment: z
    .array(z.enum(equipmentTypes))
    .refine((items) => new Set(items).size === items.length, "duplicate"),
});

export type SwimSettingsData = z.infer<typeof swimSettingsSchema>;

/**
 * The swim settings from a profile row. The database already checks these values,
 * so anything unexpected falls back to a 25 m pool without equipment.
 */
export function swimSettingsOf(profile: { pool_length: number; swim_equipment: string[] }): {
  poolLength: PoolLength;
  equipment: Equipment[];
} {
  const poolLength: PoolLength = profile.pool_length === 50 ? 50 : 25;
  const equipment = equipmentTypes.filter((item) => profile.swim_equipment.includes(item));
  return { poolLength, equipment };
}
