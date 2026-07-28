import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  AppNotification,
  Comment,
  FeedPost,
  FeedPostWithViewer,
  FeedSort,
  Game,
  Profile,
} from "@/lib/types";

export const PAGE_SIZE = 12;

/**
 * The signed-in user's profile, or null.
 *
 * Wrapped in React's `cache` so the nav bar, the page body and any nested
 * component all share ONE database round trip per request.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile) ?? null;
});

/**
 * Attaches the viewer's starred/bookmarked state to a page of posts.
 *
 * Two `IN` queries total, no matter how many posts. This is the piece the PHP
 * version got wrong: it looped and issued a query per post per metric.
 */
async function withViewerState(
  posts: FeedPost[],
  viewerId: string | null,
): Promise<FeedPostWithViewer[]> {
  if (posts.length === 0) return [];
  if (!viewerId) {
    return posts.map((p) => ({
      ...p,
      viewer_starred: false,
      viewer_bookmarked: false,
    }));
  }

  const supabase = await createClient();
  const ids = posts.map((p) => p.id);

  const [{ data: stars }, { data: marks }] = await Promise.all([
    supabase.from("post_stars").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    supabase.from("bookmarks").select("post_id").eq("user_id", viewerId).in("post_id", ids),
  ]);

  const starred = new Set((stars ?? []).map((r) => r.post_id as number));
  const booked = new Set((marks ?? []).map((r) => r.post_id as number));

  return posts.map((p) => ({
    ...p,
    viewer_starred: starred.has(p.id),
    viewer_bookmarked: booked.has(p.id),
  }));
}

const SORT_COLUMN: Record<FeedSort, string> = {
  hot: "hot_score",
  new: "created_at",
  top: "star_count",
};

export interface FeedOptions {
  sort?: FeedSort;
  page?: number;
  pageSize?: number;
  gameSlug?: string;
  authorUsername?: string;
  search?: string;
  searchField?: "title" | "content" | "author";
}

export interface FeedResult {
  posts: FeedPostWithViewer[];
  hasMore: boolean;
  total: number;
}

/**
 * The feed. One indexed scan over `post_feed`, plus the two viewer-state
 * lookups above — three queries for a whole page of posts.
 */
export async function getFeed(options: FeedOptions = {}): Promise<FeedResult> {
  const {
    sort = "hot",
    page = 0,
    pageSize = PAGE_SIZE,
    gameSlug,
    authorUsername,
    search,
    searchField = "title",
  } = options;

  const supabase = await createClient();
  const viewer = await getCurrentProfile();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("post_feed")
    .select("*", { count: "exact" })
    .eq("is_hidden", false)
    .order(SORT_COLUMN[sort], { ascending: false })
    .range(from, to);

  if (gameSlug) query = query.eq("game_slug", gameSlug);
  if (authorUsername) query = query.ilike("author_username", authorUsername);

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    if (searchField === "author") query = query.ilike("author_username", term);
    else if (searchField === "content") query = query.ilike("content", term);
    else query = query.ilike("title", term);
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[getFeed]", error.message);
    return { posts: [], hasMore: false, total: 0 };
  }

  const posts = await withViewerState((data ?? []) as FeedPost[], viewer?.id ?? null);
  return {
    posts,
    hasMore: (count ?? 0) > to + 1,
    total: count ?? 0,
  };
}

export async function getPost(id: number): Promise<FeedPostWithViewer | null> {
  const supabase = await createClient();
  const viewer = await getCurrentProfile();

  const { data } = await supabase.from("post_feed").select("*").eq("id", id).maybeSingle();
  if (!data) return null;

  // Hidden posts stay visible to their author and to admins.
  const post = data as FeedPost;
  if (post.is_hidden && viewer?.id !== post.author_id && viewer?.role !== "admin") {
    return null;
  }

  const [withState] = await withViewerState([post], viewer?.id ?? null);
  return withState;
}

/**
 * Comments for a post, assembled into a two-level tree.
 *
 * Fetches every comment for the post in ONE query and nests in memory. The old
 * app made a separate request per "view replies" click.
 */
export async function getComments(postId: number): Promise<Comment[]> {
  const supabase = await createClient();
  const viewer = await getCurrentProfile();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, post_id, author_id, parent_id, body, star_count, reply_count,
       is_hidden, created_at, updated_at,
       author:profiles!comments_author_id_fkey (
         id, username, display_name, avatar_url, level, role
       )`,
    )
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.error("[getComments]", error.message);
    return [];
  }

  // One extra query resolves the viewer's stars across every comment at once.
  let starred = new Set<number>();
  if (viewer) {
    const { data: stars } = await supabase
      .from("comment_stars")
      .select("comment_id")
      .eq("user_id", viewer.id)
      .in(
        "comment_id",
        data.map((c) => c.id as number),
      );
    starred = new Set((stars ?? []).map((r) => r.comment_id as number));
  }

  const rows = data.map((raw) => {
    const author = Array.isArray(raw.author) ? raw.author[0] : raw.author;
    return {
      ...raw,
      author,
      viewer_starred: starred.has(raw.id as number),
      replies: [],
    } as unknown as Comment;
  });

  const byId = new Map<number, Comment>(rows.map((c) => [c.id, c]));
  const roots: Comment[] = [];

  for (const comment of rows) {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)!.replies!.push(comment);
    } else {
      roots.push(comment);
    }
  }

  // Best comments float to the top; replies stay chronological.
  roots.sort((a, b) => b.star_count - a.star_count || +new Date(a.created_at) - +new Date(b.created_at));
  return roots;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle();
  return (data as Profile) ?? null;
}

/** A user's pinned "Best Posts" showcase, in the order they chose. */
export async function getPinnedPosts(profile: Profile): Promise<FeedPostWithViewer[]> {
  if (!profile.pinned_post_ids?.length) return [];

  const supabase = await createClient();
  const viewer = await getCurrentProfile();

  const { data } = await supabase
    .from("post_feed")
    .select("*")
    .in("id", profile.pinned_post_ids)
    .eq("is_hidden", false);

  const order = new Map(profile.pinned_post_ids.map((id, i) => [id, i]));
  const sorted = ((data ?? []) as FeedPost[]).sort(
    (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
  );

  return withViewerState(sorted, viewer?.id ?? null);
}

export async function getBookmarkedPosts(userId: string): Promise<FeedPostWithViewer[]> {
  const supabase = await createClient();

  const { data: marks } = await supabase
    .from("bookmarks")
    .select("post_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const ids = (marks ?? []).map((m) => m.post_id as number);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("post_feed")
    .select("*")
    .in("id", ids)
    .eq("is_hidden", false);

  const order = new Map(ids.map((id, i) => [id, i]));
  const sorted = ((data ?? []) as FeedPost[]).sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );

  return withViewerState(sorted, userId);
}

export async function getGames(search?: string): Promise<Game[]> {
  const supabase = await createClient();
  let query = supabase
    .from("games")
    .select("*")
    .order("post_count", { ascending: false })
    .limit(120);

  if (search?.trim()) query = query.ilike("name", `%${search.trim()}%`);

  const { data } = await query;
  return (data ?? []) as Game[];
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
  return (data as Game) ?? null;
}

export type LeaderboardScope = "exp" | "stars" | "posts";

export async function getLeaderboard(scope: LeaderboardScope = "exp", limit = 50) {
  const supabase = await createClient();
  const column =
    scope === "stars" ? "stars_received" : scope === "posts" ? "post_count" : "exp";

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, level, exp, stars_received, post_count, role")
    .eq("is_banned", false)
    .order(column, { ascending: false })
    .limit(limit);

  return (data ?? []) as Pick<
    Profile,
    | "id"
    | "username"
    | "display_name"
    | "avatar_url"
    | "level"
    | "exp"
    | "stars_received"
    | "post_count"
    | "role"
  >[];
}

export async function getNotifications(userId: string, limit = 40): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AppNotification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

/** Small aggregate for the feed sidebar. */
export async function getSiteStats() {
  const supabase = await createClient();
  const [posts, players, games] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_hidden", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_banned", false),
    supabase.from("games").select("id", { count: "exact", head: true }),
  ]);

  return {
    posts: posts.count ?? 0,
    players: players.count ?? 0,
    games: games.count ?? 0,
  };
}

/** Top players for the feed sidebar rail. */
export async function getTopPlayers(limit = 5) {
  return getLeaderboard("exp", limit);
}

/** Trending games for the feed sidebar rail. */
export async function getTrendingGames(limit = 6): Promise<Game[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("*")
    .gt("post_count", 0)
    .order("post_count", { ascending: false })
    .limit(limit);
  return (data ?? []) as Game[];
}
