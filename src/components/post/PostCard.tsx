"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  EyeOff,
  Flag,
  Gamepad2,
  Link2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AdminBadge, LevelBadge } from "@/components/ui/LevelBadge";
import { StarButton } from "@/components/post/StarButton";
import { BookmarkButton } from "@/components/post/BookmarkButton";
import { RatingBadge } from "@/components/post/RatingBadge";
import { useToast } from "@/components/ui/Toast";
import { deletePost, setPostHidden } from "@/lib/actions";
import type { FeedPostWithViewer, Profile } from "@/lib/types";
import { cn, compactNumber, excerpt, readingTime, timeAgo } from "@/lib/utils";

/**
 * A review in the feed.
 *
 * The whole card is a link to the post, but the action row sits above it in the
 * stacking order so starring doesn't navigate. That's why the overlay link is a
 * positioned pseudo-element rather than a wrapper — a wrapping <a> would make
 * the buttons illegal nested interactive content.
 */
export function PostCard({
  post,
  viewer,
  compact = false,
}: {
  post: FeedPostWithViewer;
  viewer: Profile | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const isOwner = viewer?.id === post.author_id;
  const isAdmin = viewer?.role === "admin";
  const canInteract = Boolean(viewer);

  const handleCopyLink = async () => {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      push("Link copied.", "success");
    } catch {
      push("Couldn't copy the link.", "error");
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (!confirm("Delete this review permanently?")) return;
    startTransition(async () => {
      const result = await deletePost(post.id);
      push(result.ok ? "Review deleted." : result.error, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  };

  const handleHide = () => {
    setMenuOpen(false);
    const reason = prompt("Reason for hiding this post?") ?? undefined;
    startTransition(async () => {
      const result = await setPostHidden(post.id, !post.is_hidden, reason);
      push(result.ok ? (result.message ?? "Done.") : result.error, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  };

  return (
    <article
      className={cn(
        "glass card-interactive group relative rounded-3xl",
        compact ? "p-4" : "p-5 sm:p-6",
        post.is_hidden && "opacity-60 ring-1 ring-danger/30",
      )}
    >
      {/* Whole-card click target, sitting beneath the controls. */}
      <Link
        href={`/post/${post.id}`}
        className="absolute inset-0 z-0 rounded-3xl"
        aria-label={`Read: ${post.title}`}
      />

      {post.is_hidden && (
        <p className="relative z-10 mb-3 inline-flex items-center gap-1.5 rounded-pill border border-danger/40 bg-danger/12 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-widest text-danger">
          <EyeOff className="h-3 w-3" />
          Hidden by a moderator
        </p>
      )}

      {/* ── Header ── */}
      <header className="relative z-10 flex items-start gap-3">
        <Link href={`/u/${post.author_username}`} className="shrink-0">
          <Avatar
            username={post.author_username}
            avatarUrl={post.author_avatar_url}
            level={post.author_level}
            size={compact ? "sm" : "md"}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/u/${post.author_username}`}
              className="truncate font-display text-sm font-bold transition-colors hover:text-brand-300"
            >
              {post.author_display_name || post.author_username}
            </Link>
            <LevelBadge level={post.author_level} size="xs" />
            {post.author_role === "admin" && <AdminBadge />}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-faint">
            <span className="truncate">@{post.author_username}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString()}>
              {timeAgo(post.created_at)}
            </time>
            {!compact && (
              <>
                <span aria-hidden="true">·</span>
                <span>{readingTime(post.content)}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Overflow menu ── */}
        <div className="relative z-20 shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More options"
            aria-expanded={menuOpen}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/6 hover:text-ink"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              {/* Click-away catcher. */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="glass-strong absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl p-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-white/6 hover:text-ink"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Copy link
                </button>

                {isOwner && (
                  <Link
                    href={`/post/${post.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-white/6 hover:text-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit review
                  </Link>
                )}

                {canInteract && !isOwner && (
                  <Link
                    href={`/report?post=${post.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-white/6 hover:text-ink"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Report
                  </Link>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleHide}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-exp transition-colors hover:bg-exp/10"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    {post.is_hidden ? "Unhide post" : "Hide post"}
                  </button>
                )}

                {(isOwner || isAdmin) && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="relative z-10 mt-4 flex gap-4">
        <div className="min-w-0 flex-1">
          {post.game_name && (
            <Link
              href={`/games/${post.game_slug}`}
              className="relative z-20 mb-2 inline-flex items-center gap-1.5 rounded-pill border border-brand-400/25 bg-brand-500/12 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-brand-200 transition-colors hover:border-brand-400/50 hover:bg-brand-500/20"
            >
              <Gamepad2 className="h-3 w-3" />
              {post.game_name}
            </Link>
          )}

          <h2
            className={cn(
              "font-display font-extrabold leading-snug tracking-tight text-ink transition-colors group-hover:text-brand-100",
              compact ? "text-base" : "text-lg sm:text-xl",
            )}
          >
            {post.title}
          </h2>

          <p
            className={cn(
              "mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-muted",
              compact && "line-clamp-2",
            )}
          >
            {excerpt(post.content, compact ? 140 : 260)}
          </p>
        </div>

        {post.rating !== null && !compact && (
          <RatingBadge rating={post.rating} size="md" className="shrink-0" />
        )}
      </div>

      {/* ── Actions ── */}
      <footer className="relative z-20 mt-4 flex items-center gap-2">
        <StarButton
          targetId={post.id}
          starred={post.viewer_starred}
          count={post.star_count}
          canInteract={canInteract}
        />

        <Link
          href={`/post/${post.id}#comments`}
          className="inline-flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-ink-muted transition-all hover:border-brand-400/40 hover:text-brand-300"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="stat text-xs font-bold">{compactNumber(post.comment_count)}</span>
        </Link>

        <span className="ml-auto flex items-center gap-2">
          {post.rating !== null && compact && (
            <RatingBadge rating={post.rating} size="sm" />
          )}
          <BookmarkButton
            postId={post.id}
            bookmarked={post.viewer_bookmarked}
            canInteract={canInteract}
          />
        </span>
      </footer>
    </article>
  );
}
