"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/queries";
import { getSiteUrl } from "@/lib/utils";
import type { ActionResult, Profile } from "@/lib/types";

/* ───────────────────────────────────────────────────────────────────────────
   Guards
   ─────────────────────────────────────────────────────────────────────────── */

/**
 * Guard result. Discriminated on `ok` rather than key presence — the failure
 * shape is deliberately identical to `ActionResult`, so a failed guard can be
 * returned straight to the caller with `if (!guard.ok) return guard;`.
 */
type Guard = { ok: false; error: string } | { ok: true; profile: Profile };

/** Resolves the caller, refusing anonymous and banned accounts. */
async function requireActiveUser(): Promise<Guard> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "You need to be signed in to do that." };
  if (profile.is_banned) return { ok: false, error: "Your account is banned." };
  return { ok: true, profile };
}

async function requireAdmin(): Promise<Guard> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "You need to be signed in to do that." };
  if (profile.role !== "admin") return { ok: false, error: "Admins only." };
  return { ok: true, profile };
}

/* ───────────────────────────────────────────────────────────────────────────
   Auth
   ─────────────────────────────────────────────────────────────────────────── */

export async function signIn(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/feed");

  if (!email || !password) return { ok: false, error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Supabase returns the same message for both cases, which is correct —
    // don't leak whether an email is registered.
    return { ok: false, error: "Wrong email or password. Try again." };
  }

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/feed");
}

export async function signUp(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password || !username) {
    return { ok: false, error: "Username, email and password are required." };
  }
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
    return {
      ok: false,
      error: "Usernames are 3–24 characters: letters, numbers and underscores only.",
    };
  }
  if (password.length < 8) {
    return { ok: false, error: "Use at least 8 characters for your password." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Those passwords don't match." };
  }

  const supabase = await createClient();

  // Check the username before creating the auth user, so people get a clear
  // error instead of silently receiving `Name1` from the collision handler.
  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (taken) return { ok: false, error: `@${username} is already taken.` };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      data: { username, display_name: displayName || username },
    },
  });

  if (error) return { ok: false, error: error.message };

  /*
   * Whether a session exists here depends on a Supabase project setting.
   * With "Confirm email" ON (the default for new projects) signUp returns a
   * user but NO session — redirecting to /feed would bounce straight back to
   * /login and look broken. Report the confirmation step instead, and only
   * jump into the app when we actually hold a session.
   */
  if (!data.session) {
    return {
      ok: true,
      message: `Almost there — we sent a confirmation link to ${email}. Click it to activate your account.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/feed?welcome=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { ok: false, error: "Enter your email address." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/settings`,
  });

  // Always report success — otherwise this endpoint enumerates accounts.
  return { ok: true, message: "If that email is registered, a reset link is on its way." };
}

/* ───────────────────────────────────────────────────────────────────────────
   Posts
   ─────────────────────────────────────────────────────────────────────────── */

export async function createPost(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const gameName = String(formData.get("game") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();

  if (title.length < 3) return { ok: false, error: "Give your review a title (3+ characters)." };
  if (content.length < 10) return { ok: false, error: "Reviews need at least 10 characters." };
  if (!gameName) return { ok: false, error: "Pick the game you're reviewing." };

  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 10)) {
    return { ok: false, error: "Score must be between 1 and 10." };
  }

  const supabase = await createClient();

  // Find-or-create the game so users aren't limited to a fixed dropdown.
  const { data: gameId, error: gameError } = await supabase.rpc("upsert_game", {
    p_name: gameName,
  });
  if (gameError) return { ok: false, error: "Couldn't save that game. Try again." };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: guard.profile.id,
      game_id: gameId,
      title: title.slice(0, 160),
      content,
      rating,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/feed");
  revalidatePath("/me");
  redirect(`/post/${data.id}`);
}

export async function updatePost(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const id = Number(formData.get("post_id"));
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "").trim();

  if (!id) return { ok: false, error: "Missing post." };
  if (title.length < 3) return { ok: false, error: "Title is too short." };
  if (content.length < 10) return { ok: false, error: "Review is too short." };

  const supabase = await createClient();
  // RLS restricts this to the author; the extra eq() makes the intent explicit.
  const { error } = await supabase
    .from("posts")
    .update({ title: title.slice(0, 160), content, rating: ratingRaw ? Number(ratingRaw) : null })
    .eq("id", id)
    .eq("author_id", guard.profile.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/post/${id}`);
  revalidatePath("/feed");
  return { ok: true, message: "Review updated." };
}

export async function deletePost(postId: number): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const query = supabase.from("posts").delete().eq("id", postId);

  // Admins may delete anything; everyone else only their own.
  if (guard.profile.role !== "admin") query.eq("author_id", guard.profile.id);

  const { error } = await query;
  if (error) return { ok: false, error: error.message };

  revalidatePath("/feed");
  revalidatePath("/me");
  return { ok: true, message: "Review deleted." };
}

/* ───────────────────────────────────────────────────────────────────────────
   Stars & bookmarks
   ─────────────────────────────────────────────────────────────────────────── */

/**
 * Toggle a star. The client updates optimistically and calls this in the
 * background, so the UI never waits on the network.
 */
export async function togglePostStar(
  postId: number,
  starred: boolean,
): Promise<ActionResult<{ starred: boolean }>> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const supabase = await createClient();

  if (starred) {
    // The PK on (post_id, user_id) makes double-starring a no-op rather than
    // a duplicate EXP award.
    const { error } = await supabase
      .from("post_stars")
      .upsert({ post_id: postId, user_id: guard.profile.id }, { ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("post_stars")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", guard.profile.id);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/post/${postId}`);
  return { ok: true, data: { starred } };
}

export async function toggleCommentStar(
  commentId: number,
  starred: boolean,
): Promise<ActionResult<{ starred: boolean }>> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const supabase = await createClient();

  if (starred) {
    const { error } = await supabase
      .from("comment_stars")
      .upsert({ comment_id: commentId, user_id: guard.profile.id }, { ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("comment_stars")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", guard.profile.id);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true, data: { starred } };
}

export async function toggleBookmark(
  postId: number,
  bookmarked: boolean,
): Promise<ActionResult<{ bookmarked: boolean }>> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const supabase = await createClient();

  if (bookmarked) {
    const { error } = await supabase
      .from("bookmarks")
      .upsert({ post_id: postId, user_id: guard.profile.id }, { ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", guard.profile.id);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/bookmarks");
  return { ok: true, data: { bookmarked } };
}

/* ───────────────────────────────────────────────────────────────────────────
   Comments
   ─────────────────────────────────────────────────────────────────────────── */

export async function addComment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const postId = Number(formData.get("post_id"));
  const parentRaw = formData.get("parent_id");
  const parentId = parentRaw ? Number(parentRaw) : null;
  const body = String(formData.get("body") ?? "").trim();

  if (!postId) return { ok: false, error: "Missing post." };
  if (!body) return { ok: false, error: "Write something first." };
  if (body.length > 4000) return { ok: false, error: "That comment is too long." };

  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: guard.profile.id,
    parent_id: parentId,
    body,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/post/${postId}`);
  return { ok: true, message: parentId ? "Reply posted." : "Comment posted." };
}

export async function deleteComment(commentId: number, postId: number): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const query = supabase.from("comments").delete().eq("id", commentId);
  if (guard.profile.role !== "admin") query.eq("author_id", guard.profile.id);

  const { error } = await query;
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/post/${postId}`);
  return { ok: true, message: "Comment deleted." };
}

/* ───────────────────────────────────────────────────────────────────────────
   Profile
   ─────────────────────────────────────────────────────────────────────────── */

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const favoriteGame = String(formData.get("favorite_game") ?? "").trim();
  const favoriteGenre = String(formData.get("favorite_genre") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const bannerUrl = String(formData.get("banner_url") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();

  if (bio.length > 500) return { ok: false, error: "Keep your bio under 500 characters." };

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    display_name: displayName || null,
    bio,
    favorite_game: favoriteGame || null,
    favorite_genre: favoriteGenre || null,
    // Empty string means the user cleared it, so null it out rather than
    // skipping the field the way avatar_url does.
    banner_url: bannerUrl || null,
  };

  if (avatarUrl) patch.avatar_url = avatarUrl;

  // Username changes need a uniqueness check first for a decent error message.
  if (username && username.toLowerCase() !== guard.profile.username.toLowerCase()) {
    if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
      return { ok: false, error: "Usernames are 3–24 characters: letters, numbers, underscores." };
    }
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .neq("id", guard.profile.id)
      .maybeSingle();
    if (taken) return { ok: false, error: `@${username} is already taken.` };
    patch.username = username;
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", guard.profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/me");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}

/** Sets the up-to-three "Best Posts" shown on a profile. */
export async function setPinnedPosts(postIds: number[]): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ pinned_post_ids: postIds.slice(0, 3) })
    .eq("id", guard.profile.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/me");
  return { ok: true, message: "Showcase updated." };
}

/* ───────────────────────────────────────────────────────────────────────────
   Notifications
   ─────────────────────────────────────────────────────────────────────────── */

export async function markNotificationsRead(ids?: number[]): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", guard.profile.id)
    .eq("is_read", false);

  if (ids?.length) query = query.in("id", ids);

  const { error } = await query;
  if (error) return { ok: false, error: error.message };

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ───────────────────────────────────────────────────────────────────────────
   Reporting
   ─────────────────────────────────────────────────────────────────────────── */

export async function reportContent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireActiveUser();
  if (!guard.ok) return guard;

  const postId = formData.get("post_id") ? Number(formData.get("post_id")) : null;
  const commentId = formData.get("comment_id") ? Number(formData.get("comment_id")) : null;
  const targetUser = (formData.get("target_user") as string) || null;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!reason) return { ok: false, error: "Tell us what's wrong with it." };
  if (!postId && !commentId && !targetUser) return { ok: false, error: "Nothing to report." };

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: guard.profile.id,
    post_id: postId,
    comment_id: commentId,
    target_user: targetUser,
    reason,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Report sent. Admins will take a look." };
}

/* ───────────────────────────────────────────────────────────────────────────
   Admin
   ─────────────────────────────────────────────────────────────────────────── */

export async function setPostHidden(
  postId: number,
  hidden: boolean,
  reason?: string,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({
      is_hidden: hidden,
      hidden_reason: hidden ? (reason ?? null) : null,
      hidden_at: hidden ? new Date().toISOString() : null,
      hidden_by: hidden ? guard.profile.id : null,
    })
    .eq("id", postId);

  if (error) return { ok: false, error: error.message };

  await supabase.from("moderation_log").insert({
    moderator_id: guard.profile.id,
    action: hidden ? "hide_post" : "unhide_post",
    post_id: postId,
    reason: reason ?? null,
  });

  revalidatePath("/admin");
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  return { ok: true, message: hidden ? "Post hidden." : "Post restored." };
}

export async function setUserBanned(
  userId: string,
  banned: boolean,
  reason?: string,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (userId === guard.profile.id) return { ok: false, error: "You can't ban yourself." };

  // Service role: the guard trigger blocks non-admin writes to ban columns, and
  // this keeps the operation working regardless of policy evaluation order.
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("role, username")
    .eq("id", userId)
    .maybeSingle();

  if (target?.role === "admin") {
    return { ok: false, error: "Admins can't be banned. Demote them first." };
  }

  const { error } = await admin
    .from("profiles")
    .update({
      is_banned: banned,
      ban_reason: banned ? (reason ?? "Violated community guidelines.") : null,
      banned_at: banned ? new Date().toISOString() : null,
      banned_by: banned ? guard.profile.id : null,
    })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };

  await admin.from("moderation_log").insert({
    moderator_id: guard.profile.id,
    action: banned ? "ban" : "unban",
    target_user: userId,
    reason: reason ?? null,
  });

  if (!banned) {
    await admin.from("notifications").insert({
      user_id: userId,
      type: "moderation",
      title: "Your ban has been lifted",
      body: "Welcome back. Please keep it civil.",
      link: "/feed",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/feed");
  return {
    ok: true,
    message: banned ? `@${target?.username} banned.` : `@${target?.username} unbanned.`,
  };
}

export async function setUserRole(userId: string, role: "user" | "admin"): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;
  if (userId === guard.profile.id) return { ok: false, error: "You can't change your own role." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await admin.from("moderation_log").insert({
    moderator_id: guard.profile.id,
    action: role === "admin" ? "promote" : "demote",
    target_user: userId,
  });

  await admin.from("notifications").insert({
    user_id: userId,
    type: "system",
    title: role === "admin" ? "You're now an admin" : "Your admin access was removed",
    body:
      role === "admin"
        ? "You can now moderate posts and manage accounts."
        : "You're back to a standard account.",
    link: "/feed",
  });

  revalidatePath("/admin");
  return { ok: true, message: `Role set to ${role}.` };
}

export async function resolveReport(
  reportId: number,
  status: "resolved" | "dismissed",
  resolution?: string,
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolved_by: guard.profile.id,
      resolved_at: new Date().toISOString(),
      resolution: resolution ?? null,
    })
    .eq("id", reportId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true, message: `Report ${status}.` };
}
