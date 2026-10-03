import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 8;
// Supabase hashes passwords with bcrypt, which ignores everything after 72 bytes.
const MAX_PASSWORD_LENGTH = 72;

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email,
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

// Logging in only checks that something was filled in: the password rules
// are enforced when the account is created.
export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export type Credentials = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({ email });

/** A new password follows the same rules as when the account was created. */
export const newPasswordSchema = registerSchema.pick({ password: true });
