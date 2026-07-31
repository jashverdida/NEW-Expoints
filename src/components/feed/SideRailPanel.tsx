import { SideRail } from "@/components/feed/SideRail";
import { getCurrentProfile, getTopPlayers, getTrendingGames } from "@/lib/queries";

/**
 * Fetches everything the right dock shows and renders it.
 *
 * Split out of the feed page so every docked route can carry the same column
 * without repeating three queries and a null check. Wrap it in its own
 * <Suspense> — it's fixed-position, so it streams in beside the page without
 * holding up or shifting anything.
 *
 * Rendering it is what gives a page a right dock; there's no list of routes
 * anywhere that could fall out of sync with reality. All six docked routes
 * render it, including Ranks — the Top Players card does restate the top of the
 * leaderboard there, but a dashboard that keeps its shape as you move around it
 * is worth more than avoiding one duplicated list.
 *
 * Returns nothing for guests, who have no progress to show and never see the
 * docks anyway.
 */
export async function SideRailPanel() {
  const [profile, topPlayers, trendingGames] = await Promise.all([
    getCurrentProfile(),
    getTopPlayers(5),
    getTrendingGames(6),
  ]);

  if (!profile) return null;

  return <SideRail profile={profile} topPlayers={topPlayers} trendingGames={trendingGames} />;
}
