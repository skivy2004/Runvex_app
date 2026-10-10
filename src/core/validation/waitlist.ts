import { z } from "zod";

/** The only thing the waitlist asks for. 254 is the longest valid email address. */
export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});

/**
 * Where a visitor came from (?ref=card-marathon) and a promo code (?code=START30),
 * both from the link they opened. Anything that doesn't fit becomes undefined:
 * a broken link must never stop someone from joining.
 */
export function parseTracking(ref: unknown, code: unknown): { source?: string; promoCode?: string } {
  const source = typeof ref === "string" ? ref.trim().toLowerCase() : "";
  const promoCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  return {
    source: /^[a-z0-9-]{1,40}$/.test(source) ? source : undefined,
    promoCode: /^[A-Z0-9-]{1,20}$/.test(promoCode) ? promoCode : undefined,
  };
}
