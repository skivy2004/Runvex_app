"use client";

import { Check, FileUp, Heart, LoaderCircle } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import {
  setHealthConsentAction,
  uploadFitAction,
  type FitUploadResult,
  type UploadedActivity,
} from "@/app/(app)/week/activityActions";
import { useFormatDistance } from "@/components/useFormatDistance";
import { useFormatDuration } from "@/components/useFormatDuration";
import { toFormattableDate } from "@/core/dates";

type FileOutcome = { name: string; result: FitUploadResult };

/**
 * Upload trainings you did as .FIT files (Garmin Connect: activity → ⚙ → Export
 * original). Each file is read on the server, the matching planned training is
 * checked off, and you see per activity where it went.
 */
export function FitUpload({ hasHealthConsent }: { hasHealthConsent: boolean }) {
  const t = useTranslations("Activities");
  const tSports = useTranslations("Sports");
  const format = useFormatter();
  const formatDuration = useFormatDuration();
  const formatDistance = useFormatDistance();
  const inputRef = useRef<HTMLInputElement>(null);
  const [outcomes, setOutcomes] = useState<FileOutcome[]>([]);
  const [busy, setBusy] = useState<{ done: number; total: number } | null>(null);
  const [consentFailed, setConsentFailed] = useState(false);
  const [isChangingConsent, startConsent] = useTransition();

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const results: FileOutcome[] = [];
    setOutcomes([]);
    // One file per request, so a big batch stays under the size limit per upload.
    for (const [index, file] of list.entries()) {
      setBusy({ done: index, total: list.length });
      const data = new FormData();
      data.set("file", file);
      let result: FitUploadResult;
      try {
        result = await uploadFitAction(data);
      } catch {
        result = { ok: false, error: "saveFailed" };
      }
      results.push({ name: file.name, result });
      setOutcomes([...results]);
    }
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function changeConsent(on: boolean) {
    setConsentFailed(false);
    startConsent(async () => {
      const result = await setHealthConsentAction(on);
      setConsentFailed(!result.ok);
    });
  }

  const describe = (activity: UploadedActivity) =>
    [
      tSports(activity.sport),
      format.dateTime(toFormattableDate(activity.performedOn), { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
      formatDuration(Math.round(activity.durationSeconds / 60)),
      activity.distanceMeters ? formatDistance(activity.distanceMeters, activity.sport) : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <section className="flex flex-col gap-3 rounded-[1.75rem] border border-white/[0.08] bg-surface/70 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue/40 text-blue-light">
          <FileUp className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="font-bold">{t("title")}</h2>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <label
        className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-blue-light/40 text-sm font-bold text-blue-light transition active:scale-[0.97] ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        {busy ? (
          <>
            <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            {t("uploading", { done: busy.done + 1, total: busy.total })}
          </>
        ) : (
          <>
            <FileUp aria-hidden className="size-4" />
            {t("choose")}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".fit,.FIT"
          multiple
          className="sr-only"
          disabled={busy !== null}
          onChange={(event) => upload(event.target.files)}
        />
      </label>

      {/* Heart rate is health data: only stored when you agree, and you can withdraw it anytime. */}
      <label className="flex items-start gap-3 rounded-2xl bg-white/[0.04] p-3 text-sm">
        <input
          type="checkbox"
          checked={hasHealthConsent}
          disabled={isChangingConsent}
          onChange={(event) => changeConsent(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-accent)]"
        />
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 font-semibold">
            <Heart aria-hidden className="size-3.5 text-coral" />
            {t("consentTitle")}
          </span>
          <span className="text-muted">{t(hasHealthConsent ? "consentOn" : "consentText")}</span>
          {consentFailed && <span role="alert" className="text-danger">{t("consentFailed")}</span>}
        </span>
      </label>

      {outcomes.length > 0 && (
        <ul aria-live="polite" className="flex flex-col gap-2">
          {outcomes.map(({ name, result }, index) =>
            result.ok ? (
              [
                ...result.activities.map((activity, activityIndex) => (
                  <li key={`${index}-${activityIndex}`} className="enter-up flex items-start gap-2 text-sm">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={3} />
                    <span>
                      <span className="font-semibold">{describe(activity)}</span>
                      <span className="block text-muted">
                        {activity.duplicate
                          ? t("duplicate")
                          : activity.linkedTo
                            ? t("linked", { name: activity.linkedTo })
                            : t("extra")}
                      </span>
                    </span>
                  </li>
                )),
                result.unsupported > 0 ? (
                  <li key={`${index}-unsupported`} className="text-sm text-muted">
                    {t("unsupported", { count: result.unsupported, name })}
                  </li>
                ) : null,
              ]
            ) : (
              <li key={index} role="alert" className="text-sm text-danger">
                {t(`error.${result.error}`, { name })}
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
