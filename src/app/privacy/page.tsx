import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import { LAST_UPDATED, privacyContent } from "@/content/privacy";
import { isLocale } from "@/core/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${privacyContent[isLocale(locale) ? locale : "en"].title} · Runvex` };
}

/** The privacy statement. Public: anyone can read it, logged in or not. */
export default async function PrivacyPage() {
  const locale = await getLocale();
  return <LegalPage content={privacyContent[isLocale(locale) ? locale : "en"]} lastUpdated={LAST_UPDATED} />;
}
