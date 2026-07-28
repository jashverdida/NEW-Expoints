import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { ArrowLeft, Eye, EyeOff, Gamepad2, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AdminBadge, LevelBadge } from "@/components/ui/LevelBadge";
import { StarButton } from "@/components/post/StarButton";
import { BookmarkButton } from "@/components/post/BookmarkButton";
import { RatingBadge } from "@/components/post/RatingBadge";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentThread } from "@/components/comments/CommentThread";
import { PostCard } from "@/components/post/PostCard";
import { createClient } from "@/lib/supabase/server";
import { getComments, getCurrentProfile, getFeed, getPost } from "@/lib/queries";
import { compactNumber, excerpt, formatDate, readingTime, timeAgo } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(Number(id));
  if (!post) return { title: "Review not found" };

  return {
    title: post.title,
    description: excerpt(post.content, 155),
    openGraph: {
      title: post.title,
      description: excerpt(post.content, 155),
      type: "article",
      authors: [post.author_username],
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) notFound();

  const [post, viewer] = await Promise.all([getPost(postId), getCurrentProfile()]);
  if (!post) notFound();

  // Comments and "more from this game" don't block each other.
  const [comments, related] = await Promise.all([
    getComments(postId),
    post.game_slug
      ? getFeed({ gameSlug: post.game_slug, sort: "top", pageSize: 4 })
      : Promise.resolve({ posts: [], hasMore: false, total: 0 }),
  ]);

  const relatedPosts = related.posts.filter((p) => p.id !== post.id).slice(0, 3);

  /*
   * Count the view after the response has been streamed, so the reader never
   * waits on a write they don't care about. The RPC does an atomic UPDATE …
   * SET view_count = view_count + 1, which avoids the lost-update race a
   * read-then-write from the app would have.
   */
  after(async () => {
    const supabase = await createClient();
    await supabase.rpc("bump_view_count", { p_post_id: postId });
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/feed"
        className="group mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to feed
      </Link>

      {post.is_hidden && (
        <p className="mb-4 flex items-center gap-2 rounded-2xl border border-danger/40 bg-danger/12 px-4 py-3 text-sm text-rose-100">
          <EyeOff className="h-4 w-4 shrink-0 text-danger" />
          This review is hidden from the public feed. Only you and admins can see it.
        </p>
      )}

      {/* ── The review ── */}
      <article className="glass-strong rounded-3xl p-5 sm:p-8">
        {post.game_name && (
          <Link
            href={`/games/${post.game_slug}`}
            className="mb-4 inline-flex items-center gap-2 rounded-pill border border-brand-400/25 bg-brand-500/12 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-brand-200 transition-colors hover:border-brand-400/50 hover:bg-brand-500/20"
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            {post.game_name}
          </Link>
        )}

        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {post.title}
            </h1>
          </div>
          {post.rating !== null && (
            <RatingBadge rating={post.rating} size="lg" className="shrink-0" />
          )}
        </div>

        {/* ── Author ── */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-white/8 py-4">
          <Link href={`/u/${post.author_username}`} className="shrink-0">
            <Avatar
              username={post.author_username}
              avatarUrl={post.author_avatar_url}
              level={post.author_level}
              size="md"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/u/${post.author_username}`}
                className="font-display text-sm font-bold transition-colors hover:text-brand-300"
              >
                {post.author_display_name || post.author_username}
              </Link>
              <LevelBadge level={post.author_level} showRank size="xs" />
              {post.author_role === "admin" && <AdminBadge />}
            </div>
            <p className="mt-0.5 text-xs text-ink-faint">
              @{post.author_username} · {formatDate(post.created_at)} · {readingTime(post.content)}
            </p>
          </div>

          <span className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Eye className="h-3.5 w-3.5" />
            <span className="stat">{compactNumber(post.view_count)}</span>
          </span>
        </div>

        {/* ── Body ── */}
        <div className="mt-6 whitespace-pre-line text-[0.98rem] leading-[1.75] text-ink-muted sm:text-base">
          {post.content}
        </div>

        {/* ── Actions ── */}
        <footer className="mt-7 flex flex-wrap items-center gap-2 border-t border-white/8 pt-5">
          <StarButton
            targetId={post.id}
            starred={post.viewer_starred}
            count={post.star_count}
            canInteract={Boolean(viewer)}
          />

          <a
            href="#comments"
            className="inline-flex items-center gap-1.5 rounded-pill border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-ink-muted transition-all hover:border-brand-400/40 hover:text-brand-300"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="stat text-xs font-bold">{compactNumber(post.comment_count)}</span>
          </a>

          <span className="ml-auto">
            <BookmarkButton
              postId={post.id}
              bookmarked={post.viewer_bookmarked}
              canInteract={Boolean(viewer)}
            />
          </span>
        </footer>
      </article>

      {/* ── Comments ── */}
      <section id="comments" className="mt-6 scroll-mt-24">
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h2 className="rule-label mb-5">
            {post.comment_count} {post.comment_count === 1 ? "Comment" : "Comments"}
          </h2>

          {viewer ? (
            <div className="mb-2 border-b border-white/8 pb-5">
              <CommentForm postId={post.id} profile={viewer} />
            </div>
          ) : (
            <p className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-sm text-ink-muted">
              <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
                Log in
              </Link>{" "}
              to join the discussion.
            </p>
          )}

          <CommentThread comments={comments} postId={post.id} viewer={viewer} />
        </div>
      </section>

      {/* ── More from this game ── */}
      {relatedPosts.length > 0 && (
        <section className="mt-6">
          <h2 className="rule-label mb-4">More {post.game_name} reviews</h2>
          <div className="space-y-3">
            {relatedPosts.map((p) => (
              <PostCard key={p.id} post={p} viewer={viewer} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
