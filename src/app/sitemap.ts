import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils";

/**
 * Sitemap covering the public surfaces: the marketing page, discover, the game
 * hubs and every visible review. This is a large part of how a review forum
 * competes with GameFAQs on search.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/discover`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/games`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/leaderboard`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/register`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const supabase = await createClient();

    const [{ data: posts }, { data: games }] = await Promise.all([
      supabase
        .from("posts")
        .select("id, updated_at")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase.from("games").select("slug").gt("post_count", 0).limit(2000),
    ]);

    return [
      ...staticRoutes,
      ...(posts ?? []).map((p) => ({
        url: `${base}/post/${p.id}`,
        lastModified: new Date(p.updated_at as string),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...(games ?? []).map((g) => ({
        url: `${base}/games/${g.slug}`,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    // A database hiccup shouldn't 500 the sitemap — serve the static routes.
    return staticRoutes;
  }
}
