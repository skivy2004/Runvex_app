// Shared between the auth Server Actions and the form that shows their result.

export type AuthErrorKey =
  | "invalidEmail"
  | "passwordTooShort"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "weakPassword"
  | "rateLimited"
  | "samePassword"
  | "passwordsDontMatch"
  | "generic";

export type AuthFormState =
  | { status: "idle"; email: string }
  | { status: "error"; error: AuthErrorKey; email: string }
  | { status: "check-email"; email: string }
  /** "Forgot password": the link is on its way (if the account exists). */
  | { status: "reset-sent"; email: string };

export const initialAuthFormState: AuthFormState = { status: "idle", email: "" };
