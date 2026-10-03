import { useTranslations } from "next-intl";

/**
 * Under "repeat password": whether both passwords are the same. When they are,
 * a check draws itself (.check-draw in globals.css).
 */
export function PasswordMatch({ password, confirmation }: { password: string; confirmation: string }) {
  const t = useTranslations("Auth");
  if (confirmation === "") return null;
  const matches = password === confirmation;

  return (
    <p aria-live="polite" className={`flex items-center gap-1.5 pl-1 text-xs font-semibold ${matches ? "text-accent" : "text-danger"}`}>
      {matches && (
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          {/* key: the check draws again each time the passwords start matching. */}
          <path key={confirmation} className="check-draw" d="M4 12.5l5 5L20 6.5" />
        </svg>
      )}
      {t(matches ? "passwordsMatch" : "passwordsDontMatch")}
    </p>
  );
}
