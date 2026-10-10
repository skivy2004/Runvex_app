import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/site";

// /robots.txt: tells search engines what they may read. Only the public pages
// matter; the app itself needs a login, so there is nothing to find there.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/auth/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
