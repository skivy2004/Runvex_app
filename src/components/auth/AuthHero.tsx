import { useTranslations } from "next-intl";

/**
 * "Train smarter. Race faster." The words appear one by one (.word-in in
 * globals.css); the last word is in the accent color.
 */
export function AuthHero() {
  const t = useTranslations("Auth");
  const words = [
    ...t("heroLine1").split(" ").map((word) => ({ word, accent: false, lineBreak: false })),
    ...t("heroLine2").split(" ").map((word, index) => ({ word, accent: false, lineBreak: index === 0 })),
    { word: t("heroAccent"), accent: true, lineBreak: false },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">
        <span aria-hidden className="h-0.5 w-6 bg-accent" />
        {t("eyebrow")}
      </p>
      <h1 className="text-[2.75rem] font-bold leading-[1.02] tracking-[-0.03em]">
        {words.map(({ word, accent, lineBreak }, index) => (
          <span key={index}>
            {lineBreak && <br />}
            <span
              className={`word-in inline-block ${accent ? "text-accent" : ""}`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {word}
            </span>{" "}
          </span>
        ))}
      </h1>
      <p className="max-w-xs text-[15px] leading-relaxed text-muted">{t("heroSubtitle")}</p>
    </div>
  );
}
