import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitShift",
  description: "Your training coach that fits around your work schedule.",
};

export const viewport: Viewport = {
  // Colors the browser bar on mobile to match the app background.
  themeColor: "#0e0f11",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        {/* Phone-width column, centered on larger screens. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
