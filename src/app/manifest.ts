import type { MetadataRoute } from "next";

// Tells the phone that Runvex is an app, not a bookmark. Added to the home screen,
// it opens full screen without the browser bars, and every page from "/" down
// (the scope) stays inside the app instead of opening in the browser.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Runvex",
    short_name: "Runvex",
    description: "Your training coach that fits around your work schedule.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0e0f11",
    theme_color: "#0e0f11",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
