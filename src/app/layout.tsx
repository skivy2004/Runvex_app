import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Runvex",
  description: "Your training coach that fits around your work schedule.",
  // On iPhone: open from the home screen as an app, without the browser bars.
  appleWebApp: { capable: true, title: "Runvex" },
};

export const viewport: Viewport = {
  // Colors the browser bar on mobile to match the app background.
  themeColor: "#0f1420",
  // Lets the app use the full iPhone screen; the tab bar keeps clear of the home bar.
  viewportFit: "cover",
  // On Android the keyboard shrinks the page (like on iPhone), so the chat box stays above it.
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${spaceGrotesk.variable} h-full antialiased`}>
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
