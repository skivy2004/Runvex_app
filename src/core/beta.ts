// The beta is open to a limited number of accounts. The database enforces it
// (supabase/migrations/20261008120000_beta_limit.sql); this is for showing it.

/** Must match public.beta_limit() in the database. */
export const BETA_LIMIT = 50;

/** Spots taken, 0-1, for the progress bar. */
export function betaTakenShare(spotsLeft: number): number {
  return Math.min(1, Math.max(0, (BETA_LIMIT - spotsLeft) / BETA_LIMIT));
}
