import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Runvex",
  description: "Your training coach that fits around your work schedule.",
};

export const viewport: Viewport = {
  // Colors the browser bar on mobile to match the app background.
  themeColor: "#0e0f11",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        {/* Makes the language and texts available to client components. */}
        <NextIntlClientProvider>
          {/* Phone-width column, centered on larger screens. */}
          <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
