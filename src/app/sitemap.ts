import type { MetadataRoute } from "next";
import { SITE_URL } from "@/core/site";

// /sitemap.xml: the public pages, so search engines find them quickly.
// Add a page here when it becomes public (e.g. a blog article).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
