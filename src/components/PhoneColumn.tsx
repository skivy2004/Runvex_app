import type { ReactNode } from "react";

/**
 * The app's phone-width column, centered on larger screens. Every page uses it
 * except the landing page, which spans the whole screen.
 */
export function PhoneColumn({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">{children}</div>;
}
