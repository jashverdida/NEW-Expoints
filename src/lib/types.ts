// Shapes returned by the database. Hand-written rather than generated so the
// app has one readable contract; regenerate with `supabase gen types` if you
// later prefer that.

export type UserRole = "user" | "admin";

export type NotificationType =
  | "star"
  | "comment"
  | "reply"
  | "level_up"
  | "mention"
  | "system"
  | "moderation";

export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  favorite_game: string | null;
  favorite_genre: string | null;
  exp: number;
  level: number;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  banned_by: string | null;
  post_count: number;
  comment_count: number;
  stars_received: number;
  pinned_post_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: number;
  slug: string;
  name: string;
  cover_url: string | null;
  release_year: number | null;
  genre: string | null;
  platforms: string[];
  post_count: number;
  avg_rating: number | null;
  created_at: string;
}

/** A row of the `post_feed` view — everything a post card needs, in one query. */
export interface FeedPost {
  id: number;
  title: string;
  content: string;
  rating: number | null;
  /** Optional attachment, stored in the `post-images` bucket. */
  image_url: string | null;
  star_count: number;
  comment_count: number;
  view_count: number;
  hot_score: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
  author_level: number;
  author_exp: number;
  author_role: UserRole;
  author_is_banned: boolean;
  game_id: number | null;
  game_name: string | null;
  game_slug: string | null;
  game_cover_url: string | null;
}

/** FeedPost plus the current viewer's relationship to it. */
export interface FeedPostWithViewer extends FeedPost {
  viewer_starred: boolean;
  viewer_bookmarked: boolean;
}

export interface CommentAuthor {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  role: UserRole;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: string;
  parent_id: number | null;
  body: string;
  star_count: number;
  reply_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author: CommentAuthor;
  viewer_starred: boolean;
  replies?: Comment[];
}

export interface AppNotification {
  id: number;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: number;
  reporter_id: string;
  post_id: number | null;
  comment_id: number | null;
  target_user: string | null;
  reason: string;
  status: ReportStatus;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution: string | null;
  created_at: string;
}

export interface ModerationLogEntry {
  id: number;
  moderator_id: string;
  action: string;
  target_user: string | null;
  post_id: number | null;
  reason: string | null;
  created_at: string;
}

/**
 * Result contract shared by every server action, so forms handle one shape.
 *
 * `field` names the input that caused a validation failure. Forms use it to
 * clear and focus just that input instead of wiping everything the user typed.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; field?: string };

export type FeedSort = "hot" | "new" | "top";
