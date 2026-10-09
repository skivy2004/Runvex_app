import { z } from "zod";

/** The only thing the waitlist asks for. 254 is the longest valid email address. */
export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});
