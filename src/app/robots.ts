import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/discover", "/games", "/leaderboard", "/post/", "/u/"],
      // Private surfaces and anything session-specific stays out of the index.
      disallow: ["/admin", "/settings", "/notifications", "/bookmarks", "/me", "/auth/", "/report"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
