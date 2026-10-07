import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    // How long the browser keeps pages it already has, in seconds. Fully prefetched
    // tabs (static) stay 5 minutes, other visited pages (dynamic) 1 minute. Every
    // change in the app clears this cache right away (src/lib/refreshAppData.ts).
    staleTimes: { dynamic: 60, static: 300 },
    // Uploading a .FIT file (a training from your watch) goes through a Server Action.
    // Normal activity files are well under 1 MB; a long ride can be a bit more.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

// Connects next-intl to src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
