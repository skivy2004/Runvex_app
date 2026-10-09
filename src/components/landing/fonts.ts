import localFont from "next/font/local";

/*
 * The landing page's own typefaces, both from Fontshare (free, also for
 * commercial use), served from our own server. Gambarino for headings,
 * Switzer for everything else. The app keeps Space Grotesk for now.
 */
export const gambarino = localFont({
  src: "../../fonts/Gambarino-Regular.woff2",
  variable: "--font-gambarino",
  display: "swap",
});

export const switzer = localFont({
  src: [
    { path: "../../fonts/Switzer-Light.woff2", weight: "300" },
    { path: "../../fonts/Switzer-Regular.woff2", weight: "400" },
    { path: "../../fonts/Switzer-Medium.woff2", weight: "500" },
  ],
  variable: "--font-switzer",
  display: "swap",
});
