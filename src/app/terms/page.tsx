import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import { LAST_UPDATED, termsContent } from "@/content/terms";
import { isLocale } from "@/core/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${termsContent[isLocale(locale) ? locale : "en"].title} · Runvex` };
}

/** The terms of use. Public: anyone can read them, logged in or not. */
export default async function TermsPage() {
  const locale = await getLocale();
  return <LegalPage content={termsContent[isLocale(locale) ? locale : "en"]} lastUpdated={LAST_UPDATED} />;
}
